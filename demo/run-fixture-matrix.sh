#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

out_dir="${TMPDIR:-/tmp}/runmatrix-demo"
rm -rf "$out_dir"

npm run build >/dev/null

node dist/cli.js plan --config examples/ci-receipt.runmatrix.yaml > "$out_dir.plan.txt"
grep -q "package=core" "$out_dir.plan.txt"
grep -q "package=cli" "$out_dir.plan.txt"

node dist/cli.js run --execute --config examples/ci-receipt.runmatrix.yaml --out-dir "$out_dir" > "$out_dir.summary.txt"
test -f "$out_dir/latest.json"
grep -q "planned=4 passed=4 failed=0" "$out_dir.summary.txt"

node dist/cli.js show --out-dir "$out_dir" > "$out_dir.show.txt"
grep -q "ci-receipt-demo" "$out_dir.show.txt"

echo "demo ok: wrote $out_dir/latest.json and $out_dir.summary.txt"
