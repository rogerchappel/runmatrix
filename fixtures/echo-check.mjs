#!/usr/bin/env node

const [packageName, nodeVersion] = process.argv.slice(2);

if (!packageName || !nodeVersion) {
  console.error("usage: echo-check <package> <node>");
  process.exit(2);
}

console.log(`checked package=${packageName} node=${nodeVersion}`);
console.log(`env RUNMATRIX_NODE=${process.env.RUNMATRIX_NODE ?? "unset"}`);
