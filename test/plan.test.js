import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";
import { expandJobs, formatPlan, runMatrix } from "../dist/index.js";

const execFileAsync = promisify(execFile);

test("expandJobs renders sorted matrix axes into planned commands", () => {
  const jobs = expandJobs({
    axes: {
      node: [20, 22],
      os: ["linux"]
    },
    commands: [
      {
        name: "test-node-{{node}}",
        run: "npm test -- --node={{node}} --os={{os}}",
        env: {
          TARGET_NODE: "{{node}}"
        }
      }
    ]
  }, "/workspace/runmatrix.yaml");

  assert.equal(jobs.length, 2);
  assert.deepEqual(jobs.map((job) => job.id), [
    "node-20-os-linux__test-node-20",
    "node-22-os-linux__test-node-22"
  ]);
  assert.equal(jobs[0].command, "npm test -- --node=20 --os=linux");
  assert.equal(jobs[1].env.TARGET_NODE, "22");
});

test("formatPlan prints a deterministic human-readable preview", () => {
  const plan = formatPlan([
    {
      id: "node-22__test",
      name: "test",
      command: "npm test",
      cwd: "/workspace",
      env: {},
      matrix: { node: 22 },
      timeoutMs: 120000,
      continueOnFailure: false
    }
  ]);

  assert.match(plan, /Planned jobs:/);
  assert.match(plan, /node=22/);
  assert.match(plan, /npm test/);
});

test("cli help advertises safe preview before execution", async () => {
  const { stdout } = await execFileAsync("node", ["dist/cli.js", "--help"]);

  assert.match(stdout, /runmatrix plan/);
  assert.match(stdout, /runmatrix run --execute/);
  assert.match(stdout, /Expand jobs without executing commands/);
});

test("runMatrix stops after a failed job unless continueOnFailure is set", async () => {
  const dir = await mkdtemp(join(tmpdir(), "runmatrix-stop-"));
  const configPath = join(dir, "runmatrix.yaml");
  const outDir = join(dir, "receipts");

  await writeFile(configPath, `name: stop-on-failure
commands:
  - name: fail-first
    run: node -e "process.exit(7)"
  - name: would-run-next
    run: node -e "console.log('unexpected')"
`, "utf8");

  const receipt = await runMatrix({ configPath, outDir, execute: true });

  assert.equal(receipt.totals.planned, 2);
  assert.equal(receipt.totals.failed, 1);
  assert.equal(receipt.totals.skipped, 1);
  assert.equal(receipt.jobs[0].status, "failed");
  assert.equal(receipt.jobs[0].exitCode, 7);
  assert.equal(receipt.jobs[1].status, "skipped");
});

test("runMatrix redacts secret-like environment keys in receipts", async () => {
  const dir = await mkdtemp(join(tmpdir(), "runmatrix-redact-"));
  const configPath = join(dir, "runmatrix.yaml");
  const outDir = join(dir, "receipts");

  await writeFile(configPath, `name: redact-env
env:
  PUBLIC_VALUE: visible
  API_TOKEN: should-not-ship
commands:
  - name: print-public
    run: node -e "console.log(process.env.PUBLIC_VALUE)"
`, "utf8");

  const receipt = await runMatrix({ configPath, outDir, execute: true });
  const latest = JSON.parse(await readFile(join(outDir, "latest.json"), "utf8"));

  assert.equal(receipt.jobs[0].env.PUBLIC_VALUE, "visible");
  assert.equal(receipt.jobs[0].env.API_TOKEN, "[REDACTED]");
  assert.equal(latest.jobs[0].env.API_TOKEN, "[REDACTED]");
  assert.equal(latest.jobs[0].stdout.trim(), "visible");
});
