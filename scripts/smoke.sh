#!/usr/bin/env bash
set -euo pipefail

rm -rf .runmatrix-smoke .runmatrix-release-gate

node dist/cli.js plan --config fixtures/smoke.yaml | grep -q "print-node-20"
node dist/cli.js plan --config examples/release-gate.yaml --json | grep -q '"id": "check-test__release-test"'
node dist/cli.js run --execute --config fixtures/smoke.yaml | grep -q "planned=1 passed=1 failed=0"
node dist/cli.js run --execute --config examples/release-gate.yaml | grep -q "planned=2 passed=2 failed=0"
node dist/cli.js show --out-dir .runmatrix-smoke | grep -q "runmatrix-smoke"
node dist/cli.js show --out-dir .runmatrix-release-gate | grep -q "release-gate-demo"

test -s .runmatrix-smoke/latest.json
test -s .runmatrix-release-gate/latest.json
node -e "const r = require('node:fs').readFileSync('.runmatrix-smoke/latest.json', 'utf8'); const receipt = JSON.parse(r); if (receipt.totals.passed !== 1 || receipt.jobs[0].stdout.trim() !== 'node=20') process.exit(1);"
node -e "const r = require('node:fs').readFileSync('.runmatrix-release-gate/latest.json', 'utf8'); const receipt = JSON.parse(r); if (receipt.totals.passed !== 2 || receipt.jobs.some((job) => !job.stdout.includes('release check='))) process.exit(1);"

rm -rf .runmatrix-smoke .runmatrix-release-gate
