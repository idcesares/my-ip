# Agent Documentation Index

This directory contains execution guidance for the current `my-ip` application. Runtime code and tests remain authoritative.

## Read order

1. Root `AGENTS.md` for repository rules and validation gates.
2. `AI_AGENT_INSTRUCTIONS.md` for the normal inspect/change/verify workflow.
3. `IMPROVED_PROJECT_SPEC.md` for product, privacy, and quality requirements.
4. `TASK_MANIFEST.json` when machine-readable orchestration is useful.
5. `FILE_TREE_REFERENCE.md` for ownership by directory.

Supporting references:

- `AGENT_ORCHESTRATION.md` — bounded parallel-work guidance.
- `QUICK_START_GUIDE.md` — local setup and common commands.
- `COMPARISON_IMPROVEMENTS.md` — why the current implementation differs from the original baseline.

## Runtime truth order

1. `src/`, `__tests__/`, and runtime configuration
2. `docs/project/`
3. `docs/agents/`

## Current baseline

- Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, and shadcn/ui primitives
- Vercel request metadata through `@vercel/functions`
- No analytics, application database, server-side history, or process-local rate limiter
- Browser-only history with a 10-entry cap
- Opt-in advanced diagnostics and WebRTC candidate comparison
- Vitest unit/component/integration coverage plus a built-server smoke suite

## Required handoff

Run `npm run typecheck`, `npm run lint`, `npm run test:coverage`, `npm run build`, `npm run test:smoke`, `npm run format`, and `npm audit --audit-level=high`. Update the relevant files in `docs/project/` for every user-visible or operational change.
