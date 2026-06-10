#!/usr/bin/env bash
set -euo pipefail

rm -rf .runmatrix-smoke

node dist/cli.js plan --config fixtures/smoke.yaml | grep -q "print-node-20"
node dist/cli.js run --execute --config fixtures/smoke.yaml | grep -q "planned=1 passed=1 failed=0"
node dist/cli.js show --out-dir .runmatrix-smoke | grep -q "runmatrix-smoke"

test -s .runmatrix-smoke/latest.json
node -e "const r = require('node:fs').readFileSync('.runmatrix-smoke/latest.json', 'utf8'); const receipt = JSON.parse(r); if (receipt.totals.passed !== 1 || receipt.jobs[0].stdout.trim() !== 'node=20') process.exit(1);"

rm -rf .runmatrix-smoke
