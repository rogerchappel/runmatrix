# runmatrix

`runmatrix` is a local-first TypeScript CLI for expanding command matrices and writing deterministic verification receipts.

It is useful when a PR, release note, or agent handoff needs proof that the same command ran across a small set of variants. The CLI can preview the matrix without executing anything, then writes a JSON receipt when execution is explicitly enabled.

## Status

This is a v0.1.0 local-first developer tool. Treat the CLI and output formats as early-stage, pin versions in automation, and run the verification commands below before relying on it in CI.

## What it helps with

- Work with cli, matrix, verification, receipts, local-first workflows from a local checkout.
- Keep generated artifacts and reports inspectable on disk instead of sending project data to a service.
- Add a repeatable smoke command that maintainers can run before review or release.

## Install from a checkout

```sh
git clone https://github.com/rogerchappel/runmatrix.git
cd runmatrix
npm install
npm run build
```

## CLI quickstart

```sh
node dist/cli.js plan --config examples/ci-receipt.runmatrix.yaml
node dist/cli.js run --execute --config examples/ci-receipt.runmatrix.yaml
node dist/cli.js show
```

`runmatrix run` refuses to execute commands unless `--execute` is present.

Start with the built CLI help so the examples match the checked-out version:

```sh
node dist/cli.js --help
```

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

## Maintained smoke

Run the maintained smoke fixture to exercise the main workflow end to end:

```sh
npm run smoke
```

The smoke command plans a tiny fixture matrix, executes it with `--execute`,
checks the latest receipts, and removes generated `.runmatrix-*` directories
before it exits. It currently expands to:

```sh
bash scripts/smoke.sh
```
## Demo Recipes

- [Local CI matrix demo](docs/tutorials/local-ci-matrix.md) shows how to preview
  and execute `examples/ci-matrix.yaml`, then inspect the generated receipt.
- `examples/release-gate.yaml` shows a two-row release gate matrix that keeps
  running all checks while preserving per-row receipts.
## Verification

```sh
npm run check
npm test
npm run smoke
npm run release:readiness
npm run package:smoke
npm run release:check
```

## Limitations

- The project is intentionally local-first; it does not manage remote credentials or upload repository contents.
- Output schemas and CLI flags may change before a stable 1.0 release.
- Review generated files before committing them, especially when they summarize logs, diffs, or dependency metadata.

## Release readiness

Use [docs/release-readiness.md](docs/release-readiness.md) before opening release PRs or tagging a release.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Keep changes small, include a fixture or smoke case when behavior changes, and paste verification output into the pull request.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting. Do not paste secrets, private tokens, or proprietary logs into issues or examples.

## License

MIT
