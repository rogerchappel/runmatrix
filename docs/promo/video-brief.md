# Video Brief: Local Matrix Receipts

## Hook

Show a command matrix expanding locally, then turn the result into a review receipt that can be attached to a PR.

## Demo beats

1. Open `examples/ci-receipt.runmatrix.yaml` and point out the `package` and `node` axes.
2. Run `node dist/cli.js plan --config examples/ci-receipt.runmatrix.yaml` to preview four jobs without executing them.
3. Run `bash demo/run-fixture-matrix.sh` to execute the fixture and write a receipt.
4. Open the generated `latest.json` and highlight command, matrix, status, duration, stdout, and stderr fields.
5. Close with the safety point: `runmatrix run` refuses to execute unless `--execute` is present.

## Exact commands

```sh
npm install
npm run build
node dist/cli.js plan --config examples/ci-receipt.runmatrix.yaml
bash demo/run-fixture-matrix.sh
```

## Claims to avoid

- Do not claim hosted CI integration is built in.
- Do not claim real Node version switching; this fixture models version rows for receipt generation.
- Do not claim parallel execution; this MVP records deterministic sequential runs.
