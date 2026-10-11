# Quick Start

## Prerequisites

- Node.js 22.22.2 or newer (CI runs Node 24)
- npm
- Optional Vercel CLI for authenticated platform work

## Local development

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Outside Vercel, IP provenance is intentionally conservative; generic forwarding headers are not silently trusted.

## Fast validation

```bash
npm run typecheck
npm run lint
npm run test
```

## Production validation

```bash
npm run test:coverage
npm run build
npm run test:smoke
npm run format
npm audit --audit-level=high
```

`test:smoke` expects a completed `.next` build, starts it on a local port, verifies page/API/security contracts, and shuts it down.

## Common entry points

- Page composition: `src/components/home-page-client.tsx`
- Public API: `src/app/api/ip/route.ts`
- IP provenance: `src/lib/ip-detection.ts`
- Browser diagnostics: `src/hooks/use-browser-diagnostics.ts`
- WebRTC assessment: `src/lib/webrtc-diagnostics.ts`
- Diagnostic explanation: `docs/project/DIAGNOSTICS.md`

Never run a production deployment or mutate Vercel project settings without explicit authorization.
