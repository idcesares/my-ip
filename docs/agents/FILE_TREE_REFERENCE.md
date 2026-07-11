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
- `src/app/api/ip/route.ts` owns public API representations.

## Verification

```text
__tests__/
  unit/                 Pure logic
  components/           Visible diagnostic states
  integration/          API route behavior
scripts/
  production-smoke.mjs  Built-server contract checks
.github/workflows/ci.yml
vitest.config.ts
```

## Documentation

```text
docs/project/            Runtime, API, privacy, diagnostics, and contribution docs
docs/agents/             Agent execution package
AGENTS.md                Repository-wide execution rules
README.md                Public project entry point
```

This is an ownership map, not an exhaustive generated listing. Use the knowledge graph and current filesystem for exact symbols and files.
