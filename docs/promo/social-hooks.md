# Social Hooks

Grounded facts for short posts about `runmatrix`:

- Local-first TypeScript CLI for expanding command matrices.
- `plan` previews jobs without executing commands.
- `run` refuses to execute unless `--execute` is present.
- `show` prints the latest receipt summary from a local output directory.
- Receipts are JSON files kept on disk for review.

## Hooks

1. "Before a CI matrix becomes a flaky workflow file, preview it locally. `runmatrix plan` expands the rows without running anything."
2. "`runmatrix run --execute` is deliberately explicit: preview first, execute second, keep the receipt."
3. "Small local proof for reviewer handoffs: run a command matrix, then attach the `.runmatrix/latest.json` receipt when it matters."

## Demo Clip Outline

1. Open `examples/ci-matrix.yaml`.
2. Run `node dist/cli.js plan --config examples/ci-matrix.yaml`.
3. Run `node dist/cli.js run --execute --config examples/ci-matrix.yaml`.
4. Run `node dist/cli.js show --out-dir .runmatrix-demo`.
5. Point out that the generated receipt stays local.

