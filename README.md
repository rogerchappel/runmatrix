# runmatrix

`runmatrix` is a local-first TypeScript CLI for expanding command matrices and writing deterministic verification receipts.

It is useful when a PR, release note, or agent handoff needs proof that the same command ran across a small set of variants. The CLI can preview the matrix without executing anything, then writes a JSON receipt when execution is explicitly enabled.

## Install

```sh
npm install
npm run build
```

## Use

```sh
node dist/cli.js plan --config examples/ci-receipt.runmatrix.yaml
node dist/cli.js run --execute --config examples/ci-receipt.runmatrix.yaml
node dist/cli.js show
```

`runmatrix run` refuses to execute commands unless `--execute` is present.

## Demo recipe

Run the checked-in fixture demo to expand a four-job matrix, execute local fixture commands, and verify the latest receipt:

```sh
npm install
npm run build
bash demo/run-fixture-matrix.sh
```

The demo uses [`examples/ci-receipt.runmatrix.yaml`](examples/ci-receipt.runmatrix.yaml) and writes a temporary receipt with:

- package and Node-version matrix values
- command names rendered from matrix templates
- exit code, duration, stdout, and stderr for each job
- summary totals for planned, passed, failed, timed-out, and skipped jobs

See [the fixture command matrix tutorial](docs/tutorials/fixture-command-matrix.md) for the walkthrough.

Promotion support drafts live in [docs/promo/video-brief.md](docs/promo/video-brief.md) and [docs/promo/social-hooks.md](docs/promo/social-hooks.md).

## Safety model

- local-only execution; no network or hosted service is required
- execution requires the explicit `--execute` flag
- receipts redact secret-looking environment keys and output snippets
- failed jobs stop later jobs unless `continueOnFailure` is set

## Verify

Run the local validation script before opening a pull request:

```sh
bash scripts/validate.sh
```

`scripts/validate.sh` runs the repository's standard local checks when they are defined and will also run `agent-qc ready` when `agent-qc` is installed. Missing `agent-qc` is treated as a skip, not a failure.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution expectations. Changes
should be small, reviewable, and verified before review.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance. Replace
the default security policy before publishing the generated repository.

These links assume this README has been copied to the generated repository root.

## License

MIT
