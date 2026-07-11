# AGENTS.md

## Purpose

Execution guide for coding agents working on this production Next.js IP and browser-diagnostics application.

## Runtime truth and reading order

1. Runtime code and tests: `src/`, `__tests__/`, `next.config.ts`.
2. Current product documentation: `README.md`, `docs/project/`.
3. Current agent routing: this file and `docs/agents/MASTER_INDEX.md`.
4. `CONTEXT.md` for domain language.

Do not implement historical snippets from agent docs when they disagree with runtime code or tests.

## Repository layout

- App Router and routes: `src/app/`
- Product modules: `src/components/`, `src/hooks/`, `src/lib/`, `src/types/`
- Owned shadcn primitives: `src/components/ui/`
- Tests: `__tests__/unit/`, `__tests__/integration/`, `__tests__/components/`
- Production smoke harness: `scripts/production-smoke.mjs`
- Runtime documentation: `docs/project/`
- Agent documentation: `docs/agents/`
- Persisted knowledge graph: `.codebase-memory/graph.db.zst`

There is intentionally no request middleware and no in-process production rate limiter. Static security headers live in `next.config.ts`; Vercel WAF owns distributed abuse protection.

## Codebase-memory workflow

Use the `my-ip-reference` knowledge-graph project for structural discovery.

1. `search_graph` for functions, modules, routes, or types.
2. `trace_path` for callers, callees, and impact analysis.
3. `get_code_snippet` after resolving an exact qualified name.
4. `query_graph` for complex relationships or quality analysis.
5. Fall back to `rg` for literals, configuration, documentation, or insufficient graph results.
6. Re-index with full persistence after structural changes.

## Architecture invariants

- `src/lib/ip-detection.ts` is the request-observation seam. It owns address canonicalization, platform trust, provenance, classification, and optional Vercel geolocation.
- `src/lib/webrtc-diagnostics.ts` owns ICE candidate parsing, address classification, and comparison with the current HTTP request.
- `src/lib/privacy-score.ts` produces evidence-based findings. Do not reintroduce numeric privacy scores or grades.
- Browser diagnostics distinguish direct values, browser estimates, unsupported APIs, unavailable probes, and not-yet-measured state.
- A public WebRTC candidate matching the current HTTP address is expected exposure, not automatically a leak.
- A single HTTP request proves only the address family used for that request.

## Privacy and security rules

- Do not add analytics, tracking, advertising, pixels, fingerprint hashes, or silent third-party enrichment.
- Browser permission diagnostics may query effective state but must never prompt for access.
- WebRTC testing must remain user-triggered and disclose its public STUN-server contact.
- Recent history stays in localStorage only and remains clearly disclosed.
- Never trust client-supplied proxy headers in Vercel mode. Cloudflare trust requires explicit `TRUSTED_PROXY_MODE=cloudflare` and exclusive Cloudflare ingress.
- API responses containing request information remain dynamic and `no-store`.

## Measurement semantics

- Network Information API `effectiveType`, `downlink`, and `rtt` are rounded browser estimates, not a speed test or ICMP ping.
- Page fetch duration is total same-origin HEAD-request duration, not pure network RTT.
- `navigator.onLine` is a hint, not proof of internet reachability.
- Hardware concurrency and device memory are browser-reported, privacy-reduced capability hints.
- Cookie count means script-visible `document.cookie` pairs; it excludes HttpOnly cookies.
- Permission state is effective for this origin and can reflect user choice, browser behavior, and Permissions-Policy.
- `crossOriginIsolated=false` is informational unless the product intentionally requires COOP/COEP.

## Implementation rules

- Use strict TypeScript and App Router patterns.
- Prefer shadcn primitives and semantic design tokens over ad-hoc controls or foundational colors.
- Preserve 320px/390px layouts, keyboard navigation, 44px primary targets, reduced-motion behavior, and explicit loading/error states.
- Add or update tests with every behavioral change.
- Update user-facing documentation in the same change.
- Use `apply_patch` for manual file edits and preserve unrelated worktree changes.

## Required validation

Run in this order:

```bash
npm run typecheck
npm run lint
npm run test:coverage
npm run build
npm run test:smoke
npm run format
npm audit
```

Coverage thresholds apply to critical pure modules. UI changes also require browser verification at desktop and 390px, checking overflow, console errors, async states, and accessible names.

## Documentation rules

- `README.md`: setup, features, scripts, deployment checklist.
- `docs/project/API.md`: endpoint contract changes.
- `docs/project/DIAGNOSTICS.md`: metric sources, interpretation, and limitations.
- `docs/project/PRIVACY.md`: collection, storage, probing, or third-party behavior.
- `docs/project/ARCHITECTURE.md`: module/seam or platform changes.
- `docs/project/CHANGELOG.md`: every user-visible behavior change.
- `docs/agents/`: execution guidance only; keep it synchronized with current runtime truth.

## Change safety

- Avoid destructive git operations.
- Do not modify Vercel project settings, WAF rules, domains, or deployments without explicit authorization.
- Preserve behavior when uncertainty is material; document known limitations rather than presenting guesses as facts.
