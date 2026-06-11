# runmatrix
Local-first TypeScript CLI for expanding command matrices and writing verification receipts.
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

Start with the built CLI help so the examples match the checked-out version:

```sh
node dist/cli.js --help
```
Run the maintained smoke fixture to exercise the main workflow end to end:

```sh
npm run smoke
```

The smoke command plans a tiny fixture matrix, executes it with `--execute`,
checks the latest receipt, and removes the generated `.runmatrix-smoke`
directory before it exits. It currently expands to:

```sh
bash scripts/smoke.sh
```
## Demo Recipes

- [Local CI matrix demo](docs/tutorials/local-ci-matrix.md) shows how to preview
  and execute `examples/ci-matrix.yaml`, then inspect the generated receipt.
## Verification

```sh
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

## Limitations

- The project is intentionally local-first; it does not manage remote credentials or upload repository contents.
- Output schemas and CLI flags may change before a stable 1.0 release.
- Review generated files before committing them, especially when they summarize logs, diffs, or dependency metadata.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Keep changes small, include a fixture or smoke case when behavior changes, and paste verification output into the pull request.

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting. Do not paste secrets, private tokens, or proprietary logs into issues or examples.

## License

MIT
