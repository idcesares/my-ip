# What's My IP?

Privacy-first IP and browser diagnostics app built with Next.js App Router.

## Features
- Server-side IP detection with proxy-aware precedence.
- IPv4/IPv6 breakdown, category detection (public/private/CGNAT/etc).
- Detection confidence and relay-likelihood indicators.
- Browser and network diagnostics collected locally in browser.
- Permission-state, secure-context, and security-header visibility (same-origin).
- Basic/Advanced diagnostics view toggle to reduce UI clutter.
- Share, copy, JSON/TXT export, and local history (last 10 checks).
- `GET /api/ip` endpoint with JSON or text output.
- Security headers middleware and in-memory rate limiting.
- SEO-ready metadata with `robots.txt`, `sitemap.xml`, Open Graph/Twitter image routes.

## Stack
- Next.js 16 + React 19 + TypeScript strict mode
- Tailwind CSS 4 + custom shadcn-style UI primitives
- SWR, Zod, Framer Motion, Lucide, Sonner
- Vitest + Testing Library

## Getting Started
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## Environment
Copy `.env.example` values into `.env.local`.

Required for production SEO correctness:
- `NEXT_PUBLIC_APP_URL`: your deployed origin (used for canonical/sitemap/robots metadata).

## Scripts
```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## SEO
- Canonical, Open Graph, Twitter metadata: `src/app/layout.tsx`
- Robots: `src/app/robots.ts`
- Sitemap: `src/app/sitemap.ts`
- OG image route: `src/app/opengraph-image.tsx`
- Twitter image route: `src/app/twitter-image.tsx`

## Repository Overview
This repo is also an architecture showcase for a privacy-first diagnostics app.

- Architecture notes and diagrams: `docs/project/ARCHITECTURE.md`
- API details: `docs/project/API.md`
- Privacy model: `docs/project/PRIVACY.md`
- Contributor workflow: `docs/project/CONTRIBUTING.md`

### Deployment Checklist
1. Set production env vars (`NEXT_PUBLIC_APP_URL`, optional geo/rate-limit flags).
2. Run quality gate: `npm run lint && npm run typecheck && npm run test && npm run build`.
3. Verify generated SEO assets/routes:
   - `/robots.txt`
   - `/sitemap.xml`
   - `/opengraph-image`
   - `/twitter-image`
4. Deploy and re-run Lighthouse (mobile + desktop) on production URL.
5. Confirm canonical and OG/Twitter previews resolve to production domain.

## API
See `docs/project/API.md`.

## Privacy
See `docs/project/PRIVACY.md`.

## Contributing
See `docs/project/CONTRIBUTING.md`.

## Changelog
See `docs/project/CHANGELOG.md`.

## Agent Docs
See `AGENTS.md` and `docs/agents/MASTER_INDEX.md`.

## Authorship
© 2026 Isaac D'Césares

- Website: https://dcesares.dev
- Open Source: https://github.com/idcesares/my-ip
- Vibe coded collaboration: Isaac D'Césares × Codex (GPT-5)

## License
MIT
