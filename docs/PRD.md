# runmatrix PRD

Status: in-progress

## Summary

runmatrix is a local-first CLI that expands a small YAML matrix into repeatable command runs, captures structured receipts, and makes agent-driven verification less hand-wavy. It is for developers who need to prove "I ran the meaningful combinations" without adopting a full CI service.

## Problem

Agentic coding runs often need several command variants: package managers, fixture directories, feature flags, OS-safe environment combinations, or smoke commands. Shell scripts handle this poorly once the matrix grows, and CI config is too remote and vendor-specific for quick local iteration.

## Users

- Developers validating CLIs across fixtures and flags.
- Agents that need deterministic local verification receipts.
- Maintainers preparing a concise proof bundle before pushing.

## V1 Scope

- Read `runmatrix.yaml` or a provided config path.
- Expand axes into deterministic jobs.
- Run jobs with timeout, cwd, env, and continue-on-failure controls.
- Write JSON and Markdown summaries under `.runmatrix/`.
- Provide `plan`, `run`, and `show` commands.
- Include fixture-backed tests and a real CLI smoke.

## Non-Goals

- Remote execution.
- Hosted dashboards.
- Secret injection.

## Safety

- No network calls unless the configured commands make them.
- Redact common secret-looking environment values in receipts.
- Require explicit `--execute`; default `plan` never runs commands.

## Inspiration

Inspired by CI matrix jobs and local task runners, reframed as a tiny deterministic receipt generator for developers and agents.
