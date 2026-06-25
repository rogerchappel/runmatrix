import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));

test("package bin points at a built CLI entrypoint", async () => {
  assert.equal(packageJson.bin?.runmatrix, "./dist/cli.js");

  await access(join(process.cwd(), packageJson.bin.runmatrix));
});

test("package exports point at built library artifacts", async () => {
  assert.equal(packageJson.main, "./dist/index.js");
  assert.equal(packageJson.types, "./dist/index.d.ts");
  assert.equal(packageJson.exports?.["."]?.import, "./dist/index.js");
  assert.equal(packageJson.exports?.["."]?.types, "./dist/index.d.ts");

  await access(join(process.cwd(), packageJson.main));
  await access(join(process.cwd(), packageJson.types));
});
