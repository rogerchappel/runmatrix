import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { test } from "node:test";
import { promisify } from "node:util";
import { expandJobs, formatPlan } from "../dist/index.js";

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
