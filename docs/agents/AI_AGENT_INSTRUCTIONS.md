# AI Agent Instructions

## Objective

Maintain a production-ready, privacy-first IP information reference. Prefer accurate explanations and explicit limitations over inferred or synthetic claims.

## Start

1. Read root `AGENTS.md` and `docs/agents/MASTER_INDEX.md`.
2. Inspect `git status`; preserve unrelated user work.
3. Use the codebase knowledge graph before text search for code discovery.
4. Read the relevant implementation, tests, and `docs/project/` page before editing.

## Architecture invariants

- Resolve the HTTP connection address on the server from trusted Vercel metadata.
- Outside Vercel, label generic forwarding headers as untrusted unless the exclusive Cloudflare ingress mode is explicitly configured.
- Keep `/api/ip` cache-disabled and validate all query parameters.
- Keep static security headers in `next.config.ts`; do not reintroduce middleware without a concrete request-time requirement.
- Treat Vercel WAF as the distributed production abuse-control layer. Do not claim an in-memory limiter protects multi-instance deployments.
- Keep browser diagnostics client-side and permission-prompt free.
- Keep history in local storage only, capped at 10 entries.
- Keep WebRTC gathering opt-in and disclose the configured public STUN servers.

## Measurement language

- The primary IP is the address used for the current HTTP request, not necessarily a device's direct or permanent address.
- `navigator.onLine` is a connectivity hint.
- Network Information API downlink and RTT are rounded estimates, not a speed test or ICMP ping.
- The same-origin probe reports total page-fetch duration, not RTT.
- Permission values are effective origin states and may reflect browser or Permissions-Policy controls.
- Script-visible cookie count excludes `HttpOnly` cookies.
- A WebRTC public candidate matching the HTTP address is expected exposure. Additional public or literal private addresses deserve attention; mDNS names indicate masking.
- “None observed” is never a guarantee.

## Implementation workflow

1. Write or update deterministic tests for normalization and assessment logic.
2. Keep browser I/O in hooks and interpretation in pure `src/lib/` functions.
3. Use existing shadcn/ui primitives and design tokens before adding a dependency.
4. Verify keyboard behavior, semantic labels, narrow layouts, dark/light themes, loading, error, unsupported, and partial states.
5. Update README, changelog, privacy, diagnostics, architecture, or API docs in the same change when applicable.

## Required validation

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

The coverage configuration protects critical pure logic. Do not weaken thresholds to make a change pass. If you use a code graph for project `my-ip-reference`, refresh it after structural edits; it is not stored in this repository.

## Deployment boundary

Repository work may prepare Vercel configuration and documentation. Changing production domains, WAF rules, environment variables, or deployments requires explicit authorization and verified credentials.
