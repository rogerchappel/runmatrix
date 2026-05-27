import { spawn } from "node:child_process";
import { mkdir, readFile, symlink, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";
import process from "node:process";
import YAML from "yaml";

export type AxisValue = string | number | boolean;

export type CommandConfig = {
  name?: string;
  run: string;
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  continueOnFailure?: boolean;
};

export type RunmatrixConfig = {
  version?: number;
  name?: string;
  cwd?: string;
  outDir?: string;
  timeoutMs?: number;
  continueOnFailure?: boolean;
  env?: Record<string, string>;
  axes?: Record<string, AxisValue[]>;
  commands: Array<string | CommandConfig>;
};

export type PlannedJob = {
  id: string;
  name: string;
  command: string;
  cwd: string;
  env: Record<string, string>;
  matrix: Record<string, AxisValue>;
  timeoutMs: number;
  continueOnFailure: boolean;
};

export type JobResult = PlannedJob & {
  status: "passed" | "failed" | "timed_out" | "skipped";
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  durationMs: number;
  stdout: string;
  stderr: string;
  startedAt: string;
  finishedAt: string;
};

export type RunReceipt = {
  schemaVersion: 1;
  runId: string;
  configPath: string;
  project: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  totals: {
    planned: number;
    passed: number;
    failed: number;
    timedOut: number;
    skipped: number;
  };
  jobs: JobResult[];
};

export type RunOptions = {
  configPath?: string;
  outDir?: string;
  execute?: boolean;
};

const DEFAULT_TIMEOUT_MS = 120_000;
const SECRET_KEY_PATTERN = /(secret|token|password|passwd|pwd|api[_-]?key|credential|private[_-]?key)/i;

export async function loadConfig(configPath = "runmatrix.yaml"): Promise<{ config: RunmatrixConfig; path: string }> {
  const resolvedPath = resolve(configPath);
  const raw = await readFile(resolvedPath, "utf8");
  const parsed = YAML.parse(raw) as unknown;
  const config = normalizeConfig(parsed, resolvedPath);

  return { config, path: resolvedPath };
}

export function expandJobs(config: RunmatrixConfig, configPath = resolve("runmatrix.yaml")): PlannedJob[] {
  const configDir = dirname(configPath);
  const baseCwd = resolvePath(config.cwd ?? ".", configDir);
  const axisEntries = Object.entries(config.axes ?? {}).sort(([a], [b]) => a.localeCompare(b));
  const matrixRows = expandAxes(axisEntries);
  const commands = config.commands.map(normalizeCommand);
  const jobs: PlannedJob[] = [];

  for (const matrix of matrixRows) {
    for (const [commandIndex, command] of commands.entries()) {
      const commandName = renderTemplate(command.name ?? `command-${commandIndex + 1}`, matrix);
      const commandCwd = resolvePath(renderTemplate(command.cwd ?? ".", matrix), baseCwd);
      const mergedEnv = renderEnv({ ...(config.env ?? {}), ...(command.env ?? {}) }, matrix);
      const renderedCommand = renderTemplate(command.run, matrix);
      const axisSlug = Object.entries(matrix)
        .map(([key, value]) => `${slugify(key)}-${slugify(String(value))}`)
        .join("-");
      const id = [axisSlug, slugify(commandName)].filter(Boolean).join("__") || slugify(commandName);

      jobs.push({
        id,
        name: commandName,
        command: renderedCommand,
        cwd: commandCwd,
        env: mergedEnv,
        matrix,
        timeoutMs: command.timeoutMs ?? config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        continueOnFailure: command.continueOnFailure ?? config.continueOnFailure ?? false
      });
    }
  }

  return jobs;
}

export async function runMatrix(options: RunOptions = {}): Promise<RunReceipt> {
  if (!options.execute) {
    throw new Error("Refusing to run without --execute. Use `runmatrix plan` to preview jobs.");
  }

  const { config, path } = await loadConfig(options.configPath);
  const plannedJobs = expandJobs(config, path);
  const startedAtTime = Date.now();
  const startedAt = new Date(startedAtTime).toISOString();
  const runId = makeRunId(startedAtTime);
  const results: JobResult[] = [];
  let stopForFailure = false;

  for (const job of plannedJobs) {
    if (stopForFailure) {
      results.push(makeSkippedResult(job));
      continue;
    }

    const result = await runJob(job);
    results.push(result);

    if (result.status !== "passed" && !job.continueOnFailure) {
      stopForFailure = true;
    }
  }

  const finishedAtTime = Date.now();
  const receipt: RunReceipt = {
    schemaVersion: 1,
    runId,
    configPath: path,
    project: config.name ?? basename(dirname(path)),
    startedAt,
    finishedAt: new Date(finishedAtTime).toISOString(),
    durationMs: finishedAtTime - startedAtTime,
    totals: summarize(results, plannedJobs.length),
    jobs: results.map(redactJobResult)
  };

  await writeReceipts(receipt, resolvePath(options.outDir ?? config.outDir ?? ".runmatrix", dirname(path)));

  return receipt;
}

export async function showLatest(outDir = ".runmatrix"): Promise<RunReceipt> {
  const raw = await readFile(resolve(outDir, "latest.json"), "utf8");
  return JSON.parse(raw) as RunReceipt;
}

export function formatPlan(jobs: PlannedJob[]): string {
  if (jobs.length === 0) {
    return "No jobs planned.";
  }

  const lines = ["Planned jobs:", ...jobs.map((job, index) => {
    const matrix = Object.entries(job.matrix).map(([key, value]) => `${key}=${value}`).join(", ") || "no axes";
    return `${index + 1}. ${job.id} | ${matrix} | ${job.command}`;
  })];

  return `${lines.join("\n")}\n`;
}

export function formatReceipt(receipt: RunReceipt): string {
  const totals = receipt.totals;
  const lines = [
    `${receipt.project} ${receipt.runId}`,
    `planned=${totals.planned} passed=${totals.passed} failed=${totals.failed} timed_out=${totals.timedOut} skipped=${totals.skipped}`,
    "",
    ...receipt.jobs.map((job) => `${statusIcon(job.status)} ${job.id} (${job.durationMs}ms)`)
  ];

  return `${lines.join("\n")}\n`;
}

function normalizeConfig(value: unknown, configPath: string): RunmatrixConfig {
  if (!isRecord(value)) {
    throw new Error(`${configPath} must contain a YAML object.`);
  }

  if (!Array.isArray(value.commands) || value.commands.length === 0) {
    throw new Error("runmatrix config requires at least one command.");
  }

  const axes = value.axes;
  if (axes !== undefined) {
    if (!isRecord(axes)) {
      throw new Error("axes must be an object of arrays.");
    }

    for (const [key, axisValues] of Object.entries(axes)) {
      if (!Array.isArray(axisValues) || axisValues.length === 0) {
        throw new Error(`axis "${key}" must be a non-empty array.`);
      }
    }
  }

  return value as RunmatrixConfig;
}

function normalizeCommand(command: string | CommandConfig): CommandConfig {
  if (typeof command === "string") {
    return { run: command };
  }

  if (!isRecord(command) || typeof command.run !== "string" || command.run.trim() === "") {
    throw new Error("each command must be a string or an object with a non-empty run field.");
  }

  return command;
}

function expandAxes(axisEntries: Array<[string, AxisValue[]]>): Array<Record<string, AxisValue>> {
  if (axisEntries.length === 0) {
    return [{}];
  }

  return axisEntries.reduce<Array<Record<string, AxisValue>>>((rows, [axisName, values]) => {
    const nextRows: Array<Record<string, AxisValue>> = [];

    for (const row of rows) {
      for (const value of values) {
        nextRows.push({ ...row, [axisName]: value });
      }
    }

    return nextRows;
  }, [{}]);
}

async function runJob(job: PlannedJob): Promise<JobResult> {
  const startedAtTime = Date.now();
  const startedAt = new Date(startedAtTime).toISOString();
  const child = spawn(job.command, {
    cwd: job.cwd,
    env: { ...process.env, ...job.env },
    shell: true,
    stdio: ["ignore", "pipe", "pipe"]
  });

  let stdout = "";
  let stderr = "";
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    child.kill("SIGTERM");
  }, job.timeoutMs);

  child.stdout?.on("data", (chunk: Buffer) => {
    stdout += chunk.toString("utf8");
  });
  child.stderr?.on("data", (chunk: Buffer) => {
    stderr += chunk.toString("utf8");
  });

  const { exitCode, signal } = await new Promise<{ exitCode: number | null; signal: NodeJS.Signals | null }>((resolveClose) => {
    child.on("close", (code, closeSignal) => {
      resolveClose({ exitCode: code, signal: closeSignal });
    });
  });

  clearTimeout(timeout);
  const finishedAtTime = Date.now();
  const status = timedOut ? "timed_out" : exitCode === 0 ? "passed" : "failed";

  return {
    ...job,
    status,
    exitCode,
    signal,
    durationMs: finishedAtTime - startedAtTime,
    stdout,
    stderr,
    startedAt,
    finishedAt: new Date(finishedAtTime).toISOString()
  };
}

function makeSkippedResult(job: PlannedJob): JobResult {
  const now = new Date().toISOString();

  return {
    ...job,
    status: "skipped",
    exitCode: null,
    signal: null,
    durationMs: 0,
    stdout: "",
    stderr: "Skipped after a previous job failed and continueOnFailure was false.",
    startedAt: now,
    finishedAt: now
  };
}

async function writeReceipts(receipt: RunReceipt, outDir: string): Promise<void> {
  await mkdir(outDir, { recursive: true });
  const jsonPath = join(outDir, `${receipt.runId}.json`);
  const mdPath = join(outDir, `${receipt.runId}.md`);
  await writeFile(jsonPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  await writeFile(mdPath, renderMarkdownReceipt(receipt), "utf8");
  await writeFile(join(outDir, "latest.json"), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  await writeFile(join(outDir, "latest.md"), renderMarkdownReceipt(receipt), "utf8");

  try {
    await unlink(join(outDir, "latest"));
    await symlink(`${receipt.runId}.json`, join(outDir, "latest"));
  } catch {
    // Symlinks are a convenience only; JSON and Markdown latest files are authoritative.
  }
}

function renderMarkdownReceipt(receipt: RunReceipt): string {
  const rows = receipt.jobs
    .map((job) => `| ${job.id} | ${job.status} | ${job.exitCode ?? ""} | ${job.durationMs} |`)
    .join("\n");

  return `# runmatrix receipt: ${receipt.runId}

- Project: ${receipt.project}
- Started: ${receipt.startedAt}
- Finished: ${receipt.finishedAt}
- Planned: ${receipt.totals.planned}
- Passed: ${receipt.totals.passed}
- Failed: ${receipt.totals.failed}
- Timed out: ${receipt.totals.timedOut}
- Skipped: ${receipt.totals.skipped}

| Job | Status | Exit | Duration ms |
| --- | --- | ---: | ---: |
${rows}
`;
}

function summarize(results: JobResult[], planned: number): RunReceipt["totals"] {
  return {
    planned,
    passed: results.filter((result) => result.status === "passed").length,
    failed: results.filter((result) => result.status === "failed").length,
    timedOut: results.filter((result) => result.status === "timed_out").length,
    skipped: results.filter((result) => result.status === "skipped").length
  };
}

function redactJobResult(job: JobResult): JobResult {
  return {
    ...job,
    env: Object.fromEntries(Object.entries(job.env).map(([key, value]) => [key, SECRET_KEY_PATTERN.test(key) ? "[REDACTED]" : value]))
  };
}

function renderEnv(env: Record<string, string>, matrix: Record<string, AxisValue>): Record<string, string> {
  return Object.fromEntries(Object.entries(env).map(([key, value]) => [key, renderTemplate(String(value), matrix)]));
}

function renderTemplate(input: string, matrix: Record<string, AxisValue>): string {
  return input.replace(/\{\{\s*(?:matrix\.)?([a-zA-Z0-9_-]+)\s*\}\}/g, (_match, key: string) => {
    const value = matrix[key];
    return value === undefined ? "" : String(value);
  });
}

function resolvePath(path: string, base: string): string {
  return isAbsolute(path) ? path : resolve(base, path);
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function makeRunId(timestamp: number): string {
  return `run-${new Date(timestamp).toISOString().replace(/[:.]/g, "-")}`;
}

function statusIcon(status: JobResult["status"]): string {
  return {
    failed: "FAIL",
    passed: "PASS",
    skipped: "SKIP",
    timed_out: "TIMEOUT"
  }[status];
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
