# Fixture Command Matrix Demo

This demo shows how `runmatrix` expands a small YAML matrix into deterministic command receipts without depending on a hosted runner.

## What the fixture covers

- two logical packages: `core` and `cli`
- two Node versions represented as matrix values: `20` and `22`
- a command-level name template so each receipt row is reviewable
- a matrix value passed through the environment as `RUNMATRIX_NODE`

The checked-in config lives at [`examples/ci-receipt.runmatrix.yaml`](../../examples/ci-receipt.runmatrix.yaml). The command target is a local fixture script at [`fixtures/echo-check.mjs`](../../fixtures/echo-check.mjs).

## Run it

```sh
npm install
npm run build
bash demo/run-fixture-matrix.sh
```

The demo writes outputs under a temporary `runmatrix-demo` directory:

- `latest.json` with the full receipt
- a text summary with planned, passed, failed, timed-out, and skipped totals
- a plan preview that proves the matrix expands before commands execute

## Why it is useful in a PR

`runmatrix plan` is safe for review because it expands jobs without executing commands. `runmatrix run --execute` records the exact command, matrix row, exit code, duration, stdout, and stderr for each job. The receipt can be attached to a PR or release note as evidence that the same checks ran across each intended matrix row.

## Verification

```sh
npm run smoke
```

`npm run smoke` delegates to the fixture demo and checks that the four expected jobs pass and that `show` can read the latest receipt.
