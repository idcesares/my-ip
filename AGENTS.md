# AGENTS.md

## Purpose
Execution guide for AI coding agents working in this repository.

## Repository Layout
- Runtime application code: `src/`, `public/`, `middleware.ts`
- Tests: `__tests__/`
- Agent documentation package: `docs/agents/`
- Project documentation: `docs/project/`

## Primary Agent Inputs
1. Start with `docs/agents/MASTER_INDEX.md`.
2. Use `docs/agents/AI_AGENT_INSTRUCTIONS.md` as the default execution source.
3. Use `docs/agents/TASK_MANIFEST.json` if machine-readable orchestration is needed.
4. Use `docs/agents/IMPROVED_PROJECT_SPEC.md` for product and quality constraints.
5. Treat runtime truth priority as: `src/` + tests > `docs/project/` > `docs/agents/`.

## Execution Rules
- Prefer strict TypeScript and App Router patterns.
- Do not add tracking or analytics.
- Keep privacy-first behavior as default.
- Validate all changes with:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build`

## Documentation Rules
- Keep runtime docs in `docs/project/`.
- Keep agent orchestration/spec docs in `docs/agents/`.
- Keep root minimal: only build/runtime/config essentials plus this file and `README.md`.
- For user-visible behavior changes, update these in the same change:
  - `README.md`
  - `docs/project/API.md` (if response/endpoint behavior changed)
  - `docs/project/PRIVACY.md` (if collection/probing behavior changed)
  - `docs/project/CHANGELOG.md`

## Change Safety
- Do not delete production files unless explicitly requested.
- Avoid destructive git operations.
- When uncertain, preserve behavior and add clear notes in PR/commit messages.
