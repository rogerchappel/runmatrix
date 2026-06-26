#!/usr/bin/env node
import process from "node:process";
import { expandJobs, formatPlan, formatReceipt, loadConfig, runMatrix, showLatest } from "./index.js";
import { VERSION } from "./version.js";

type ParsedArgs = {
  command?: string;
  config?: string;
  outDir?: string;
  execute: boolean;
  json: boolean;
  help: boolean;
};

async function main(argv: string[]): Promise<number> {
  const args = parseArgs(argv);

  if (args.command === "--version" || args.command === "-v") {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }

  if (args.help || !args.command) {
    process.stdout.write(helpText());
    return args.help ? 0 : 1;
  }

  if (args.command === "plan") {
    const { config, path } = await loadConfig(args.config);
    const jobs = expandJobs(config, path);
    process.stdout.write(args.json ? `${JSON.stringify({ jobs }, null, 2)}\n` : formatPlan(jobs));
    return 0;
  }

  if (args.command === "run") {
    if (!args.execute) {
      process.stderr.write("Refusing to run without --execute. Preview with `runmatrix plan`, then rerun with `runmatrix run --execute`.\n");
      return 2;
    }

    const receipt = await runMatrix({ configPath: args.config, outDir: args.outDir, execute: true });
    process.stdout.write(args.json ? `${JSON.stringify(receipt, null, 2)}\n` : formatReceipt(receipt));
    return receipt.totals.failed > 0 || receipt.totals.timedOut > 0 ? 1 : 0;
  }

  if (args.command === "show") {
    const receipt = await showLatest(args.outDir);
    process.stdout.write(args.json ? `${JSON.stringify(receipt, null, 2)}\n` : formatReceipt(receipt));
    return receipt.totals.failed > 0 || receipt.totals.timedOut > 0 ? 1 : 0;
  }

  process.stderr.write(`Unknown command: ${args.command}\n\n${helpText()}`);
  return 1;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    command: undefined,
    config: undefined,
    outDir: undefined,
    execute: false,
    json: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--config" || arg === "-c") {
      parsed.config = takeValue(argv, index, arg);
      index += 1;
    } else if (arg.startsWith("--config=")) {
      parsed.config = arg.slice("--config=".length);
    } else if (arg === "--out-dir") {
      parsed.outDir = takeValue(argv, index, arg);
      index += 1;
    } else if (arg.startsWith("--out-dir=")) {
      parsed.outDir = arg.slice("--out-dir=".length);
    } else if (arg === "--execute") {
      parsed.execute = true;
    } else if (arg === "--json") {
      parsed.json = true;
    } else if (!parsed.command) {
      parsed.command = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  return parsed;
}

function takeValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith("-")) {
    throw new Error(`${flag} requires a value.`);
  }

  return value;
}

function helpText(): string {
  return `runmatrix

Local matrix runner for deterministic command receipts.

Usage:
  runmatrix --version
  runmatrix plan [--config runmatrix.yaml] [--json]
  runmatrix run --execute [--config runmatrix.yaml] [--out-dir .runmatrix] [--json]
  runmatrix show [--out-dir .runmatrix] [--json]

Commands:
  plan   Expand jobs without executing commands.
  run    Execute jobs only when --execute is present.
  show   Print the latest receipt summary.
`;
}

main(process.argv.slice(2)).then((code) => {
  process.exitCode = code;
}).catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
