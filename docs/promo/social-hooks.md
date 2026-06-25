# Social Hooks

## Short posts

1. `runmatrix` is a tiny local-first CLI for turning command matrices into reviewable receipts. Preview the matrix, opt in to execution, then attach `latest.json` to a PR.
2. New demo: a four-job fixture matrix for `core` and `cli` rows across Node 20 and 22 labels. It writes a deterministic receipt without a hosted runner.
3. The guardrail I like in `runmatrix`: `plan` previews jobs, and `run` refuses to execute until `--execute` is present.
4. "Before a CI matrix becomes a flaky workflow file, preview it locally. `runmatrix plan` expands the rows without running anything."
5. "`runmatrix run --execute` is deliberately explicit: preview first, execute second, keep the receipt."
6. "Small local proof for reviewer handoffs: run a command matrix, then attach the `.runmatrix/latest.json` receipt when it matters."

## Grounded Facts

- Local-first TypeScript CLI for expanding command matrices.
- `plan` previews jobs without executing commands.
- `run` refuses to execute unless `--execute` is present.
- `show` prints the latest receipt summary from a local output directory.
- Receipts are JSON files kept on disk for review.

## Demo link copy

Run the fixture-backed demo:

```sh
npm install
npm run build
bash demo/run-fixture-matrix.sh
```

The script verifies the planned matrix, executes four local commands, and checks that `show` can read the latest receipt.

## Demo Clip Outline

1. Open `examples/ci-matrix.yaml`.
2. Run `node dist/cli.js plan --config examples/ci-matrix.yaml`.
3. Run `node dist/cli.js run --execute --config examples/ci-matrix.yaml`.
4. Run `node dist/cli.js show --out-dir .runmatrix-demo`.
5. Point out that the generated receipt stays local.
