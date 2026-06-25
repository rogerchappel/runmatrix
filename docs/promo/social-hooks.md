# Social Hooks

## Short posts

1. `runmatrix` is a tiny local-first CLI for turning command matrices into reviewable receipts. Preview the matrix, opt in to execution, then attach `latest.json` to a PR.
2. New demo: a four-job fixture matrix for `core` and `cli` rows across Node 20 and 22 labels. It writes a deterministic receipt without a hosted runner.
3. The guardrail I like in `runmatrix`: `plan` previews jobs, and `run` refuses to execute until `--execute` is present.

## Demo link copy

Run the fixture-backed demo:

```sh
npm install
npm run build
bash demo/run-fixture-matrix.sh
```

The script verifies the planned matrix, executes four local commands, and checks that `show` can read the latest receipt.
