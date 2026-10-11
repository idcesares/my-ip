# AI Assistant Guide

Use [AGENTS.md](AGENTS.md) as the authoritative repository execution guide. Start with [docs/agents/MASTER_INDEX.md](docs/agents/MASTER_INDEX.md), then follow [docs/agents/AI_AGENT_INSTRUCTIONS.md](docs/agents/AI_AGENT_INSTRUCTIONS.md) for the inspect, implement, document, and validation workflow.

## Current baseline

- Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, and shadcn/ui primitives.
- Vercel request metadata through `@vercel/functions`; no third-party IP enrichment.
- No analytics, tracking SDK, application database, or server-side check history.
- Static security headers in `next.config.ts`; distributed production abuse controls belong in Vercel WAF.
- Browser-only history capped at 10 entries.
- Advanced diagnostics and WebRTC candidate gathering are user-triggered.
- Diagnostic findings are descriptive; do not introduce synthetic privacy scores or unsupported VPN/relay claims.

## Required checks

```bash
npm run typecheck
npm run lint
npm run test:coverage
npm run build
npm run test:smoke
npm run test:e2e
npm run format
npm audit --audit-level=high
```

Runtime code and tests take precedence over documentation. Keep `README.md`, `docs/project/`, and agent guidance synchronized with user-visible or architectural changes. If you use a `my-ip-reference` code graph, refresh it after structural edits.
