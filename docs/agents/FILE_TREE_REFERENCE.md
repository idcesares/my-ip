# File Tree Reference

## Runtime

```text
src/
  app/                 App Router pages, metadata, images, and /api/ip
  components/          Product UI and shadcn/ui primitives
  hooks/               Browser I/O and client state
  lib/                 Pure parsing, normalization, assessment, and export logic
  types/               Shared TypeScript contracts
public/                 Static assets
next.config.ts          Static security headers and framework configuration
```

Key diagnostic ownership:

- `src/hooks/use-browser-diagnostics.ts` performs browser collection.
- `src/lib/browser-metrics.ts` normalizes coarse browser values.
- `src/hooks/use-webrtc-leak.ts` manages the short-lived peer connection.
- `src/lib/webrtc-diagnostics.ts` parses, classifies, and compares candidates.
- `src/lib/privacy-score.ts` produces descriptive findings.
- `src/lib/ip-detection.ts` resolves trusted request provenance.
- `src/lib/address-family.ts` words the missing-address-family text per host and says which families a host can observe.
- `src/lib/browser-snapshot.ts` collects browser signals and runs the page/header probe; `src/lib/security-headers.ts` and `src/lib/permissions.ts` interpret header values and permission readings.
- `src/components/diagnostics/` holds one component per diagnostic panel; `src/components/info-grid.tsx` composes them.
- `src/lib/site-url.ts` resolves the canonical origin.
- `src/app/api/ip/route.ts` owns public API representations.

## Verification

```text
__tests__/
  unit/                 Pure logic
  components/           Visible diagnostic states
  integration/          API route behavior
scripts/
  production-smoke.mjs  Built-server contract checks
  deployment-smoke.mjs  Live-URL checks for Vercel provenance, geo, and headers
.github/workflows/ci.yml
.github/workflows/deployment-smoke.yml
vitest.config.mts
```

## Documentation

```text
docs/project/            Runtime, API, privacy, diagnostics, and contribution docs
docs/agents/             Agent execution package
AGENTS.md                Repository-wide execution rules
README.md                Public project entry point
```

This is an ownership map, not an exhaustive generated listing. Use the knowledge graph and current filesystem for exact symbols and files.
