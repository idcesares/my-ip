# What's My IP?

Privacy-first IP and browser diagnostics app built with Next.js App Router.

## Features
- Server-side IP detection with proxy-aware precedence.
- IPv4/IPv6 breakdown, category detection (public/private/CGNAT/etc).
- Browser and network diagnostics collected locally in browser.
- Share, copy, JSON/TXT export, and local history (last 10 checks).
- `GET /api/ip` endpoint with JSON or text output.
- Security headers middleware and in-memory rate limiting.

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

## Scripts
```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

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

## License
MIT