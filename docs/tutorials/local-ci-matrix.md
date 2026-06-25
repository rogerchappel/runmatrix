# Local CI Matrix Demo

This recipe shows how to preview and run a tiny local matrix before turning the
same idea into CI jobs.

## Setup

```sh
npm install
npm run build
```

## Preview the matrix

```sh
node dist/cli.js plan --config examples/ci-matrix.yaml
```

The plan expands `node: [20, 22]` into two jobs and prints the rendered command
for each row. `plan` does not execute commands.

## Execute deliberately

```sh
node dist/cli.js run --execute --config examples/ci-matrix.yaml
```

`run` requires `--execute` so scripts can preview first and opt in to command
execution. The example writes receipts under `.runmatrix-demo/`.

## Review the latest receipt

```sh
node dist/cli.js show --out-dir .runmatrix-demo
test -s .runmatrix-demo/latest.json
```

Commit the YAML when it is useful as a shared smoke matrix. Do not commit the
generated `.runmatrix-demo/` receipts unless a reviewer explicitly asks for
that local evidence.

## Try a release gate matrix

`examples/release-gate.yaml` demonstrates a release-check shape that expands
two rows and keeps running every row with `continueOnFailure: true`.

```sh
node dist/cli.js plan --config examples/release-gate.yaml --json
node dist/cli.js run --execute --config examples/release-gate.yaml
node dist/cli.js show --out-dir .runmatrix-release-gate
```

Remove `.runmatrix-release-gate/` after local review unless you intentionally
need to share the receipt files.
