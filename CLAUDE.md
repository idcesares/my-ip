# CLAUDE.md — AI Assistant Guide for `my-ip`

This document provides context for AI assistants (Claude, Copilot, etc.) working on this codebase. Read it before making changes.

---

## Project Overview

**What's My IP?** is a production-grade, privacy-first IP diagnostics web application. It detects the visitor's IP address (proxy-aware), collects opt-in browser telemetry, and presents the data in a clean UI. No server-side tracking, no fingerprinting.

- **Live stack**: Next.js 16 (App Router) + React 19 + TypeScript 5 (strict)
- **Styling**: Tailwind CSS 4 + CSS custom properties (HSL variables)
- **Testing**: Vitest 4 + Testing Library (jsdom environment)
- **Deployment**: Docker (Node 20 Alpine) or Vercel

---

## Repository Layout

```
src/
  app/
    api/ip/route.ts          # Single API endpoint — GET /api/ip
    layout.tsx               # Root layout with metadata + Vercel Analytics
    page.tsx                 # Server component, renders HomePageClient
    globals.css              # Tailwind 4 + CSS variable token system
    opengraph-image.tsx      # OG image route
    twitter-image.tsx        # Twitter card image route
    robots.ts                # SEO robots config
    sitemap.ts               # SEO sitemap
  components/
    home-page-client.tsx     # Main client layout (composes all sections)
    ip-address-card.tsx      # Primary IP display card
    action-bar.tsx           # Share / export / refresh controls
    info-grid.tsx            # Browser diagnostics grid
    history-table.tsx        # localStorage-based history table
    copy-button.tsx          # Clipboard utility component
    privacy-accordion.tsx    # Privacy FAQ accordion
    theme-toggle.tsx         # Dark/light mode toggle
    theme-provider.tsx       # next-themes provider wrapper
    ui/                      # shadcn-style primitives (button, card, badge, etc.)
  hooks/
    use-ip-info.ts           # SWR hook → GET /api/ip (60s refresh)
    use-browser-diagnostics.ts  # Client-side telemetry collector
    use-history.ts           # localStorage history (max 10 entries)
  lib/
    ip-detection.ts          # Server-side IP extraction from headers
    ip-utils.ts              # IP parsing, version detection, categorization
    rate-limit.ts            # In-memory rate limiter (60 req/min per IP)
    schemas.ts               # Zod validation schemas for query params
    export.ts                # Text/JSON report generation + downloads
    utils.ts                 # cn() class merging utility
  types/index.ts             # Shared TypeScript interfaces

__tests__/
  setup.ts                   # jest-dom setup
  unit/
    ip-utils.test.ts         # IP parsing unit tests
  integration/
    api-route.test.ts        # Full API route tests (mocked deps)
    api-ip.test.ts           # Additional API tests
    rate-limit.test.ts       # Rate limiter tests

docs/
  project/                   # User-facing docs (ARCHITECTURE, API, PRIVACY, etc.)
  agents/                    # AI agent orchestration docs

middleware.ts                # Security headers (CSP, X-Frame-Options, etc.)
next.config.ts               # Next.js config (Turbopack, strict mode)
tailwind.config.ts           # Tailwind with class-based dark mode
vitest.config.ts             # Vitest with jsdom + path aliases
tsconfig.json                # TypeScript strict config (ES2022, bundler resolution)
Dockerfile                   # Multi-stage build (deps → builder → runner)
```

---

## Development Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run typecheck    # tsc --noEmit (no output, type errors only)
npm run test         # Run all tests once
npm run test:watch   # Watch mode
npm run format       # Prettier format check
```

**Run these before committing**: `npm run typecheck && npm run lint && npm run test`

---

## Key Architecture Decisions

### API Endpoint: `GET /api/ip`

The only server-side endpoint. Accepts query params:
- `?format=json|text` — response format (default: json)
- `?include=geo` — fetch geolocation from ipapi.co (opt-in, 3.5s timeout)

**IP detection header precedence** (see `src/lib/ip-detection.ts`):
1. `cf-connecting-ip` (Cloudflare — high confidence)
2. `x-real-ip` (nginx proxy — medium confidence)
3. `x-forwarded-for` (first non-private IP — medium confidence)
4. `forwarded` header (RFC 7239)
5. Socket remote address (direct — low confidence)

**Rate limiting**: 60 requests per minute per IP, in-memory (resets on server restart). Returns HTTP 429 with `Retry-After` header when exceeded.

### Privacy Model

- **No server-side logging** of IP addresses or request data
- **No cookies**, no sessions, no tracking pixels
- **Browser diagnostics** are collected client-side only (never sent to server)
- **History** is stored in `localStorage` only (max 10 entries)
- **Geolocation** requires explicit `?include=geo` parameter — opt-in only
- **No canvas/audio fingerprinting** in browser diagnostics

### Component Architecture

- `page.tsx` is a **server component** — just renders `<HomePageClient />`
- `home-page-client.tsx` is the main **client component** (`"use client"`) that composes all sections
- UI primitives live in `src/components/ui/` — treat them like a local shadcn library; edit sparingly

### State Management

- **Remote data**: SWR (`use-ip-info.ts`) — auto-refresh every 60 seconds
- **Client diagnostics**: Custom hook (`use-browser-diagnostics.ts`) — lazy, computed once
- **History**: `localStorage` via `use-history.ts` hook
- **Theme**: `next-themes` provider wrapping the app

---

## Coding Conventions

### TypeScript

- **Strict mode** is on — no `any`, no unused vars/params, no implicit returns
- Use path alias `@/` for all imports from `src/` (e.g., `import { cn } from "@/lib/utils"`)
- Interfaces and types live in `src/types/index.ts` or colocated if component-specific
- Zod schemas in `src/lib/schemas.ts` for all external input validation

### File & Naming

- **Files**: kebab-case (`home-page-client.tsx`, `use-browser-diagnostics.ts`)
- **Components**: PascalCase exports
- **Hooks**: camelCase, prefixed with `use`
- **Constants**: UPPER_SNAKE_CASE
- **Utilities**: camelCase functions

### Styling

- Tailwind utility classes are primary; avoid inline styles
- Dark mode via `.dark` class on `<html>` (managed by `next-themes`)
- CSS variables defined in `globals.css` as HSL values — use semantic tokens, not raw colors
- Use `cn()` from `@/lib/utils` to merge conditional class names

### Error Handling

- Use Zod `safeParse` (not `parse`) — always check `result.success` before accessing `.data`
- API errors return `{ error: string, statusCode: number, timestamp: string }` shape
- Geolocation fetch uses `AbortController` with 3.5s timeout
- Use nullish coalescing (`??`) for optional/missing values; avoid `||` for boolean-falsy cases

### Performance

- Use `LazyMotion` + `domAnimation` from Framer Motion — do not import full `motion` bundle
- Advanced browser diagnostics (permissions, hardware) are collected lazily on user toggle
- Don't add new heavy dependencies without justification

---

## Testing Guidelines

- **Unit tests**: Pure functions in `src/lib/` (especially `ip-utils.ts`)
- **Integration tests**: API route handlers with mocked dependencies
- **Mock pattern**: Use `vi.mock("@/lib/ip-detection")` and `vi.mock("@/lib/rate-limit")` in integration tests; do not test third-party network calls
- **No React component tests** currently — adding them is welcome but not required
- Test files live in `__tests__/` mirroring `unit/` and `integration/` subdirectories
- All tests run in jsdom environment (see `vitest.config.ts`)

---

## Security Constraints

Do not weaken or bypass:

- **Content Security Policy** in `middleware.ts` — if you need to add an external resource, update the CSP header explicitly
- **Rate limiter** — do not disable or stub it in production code
- **Zod validation** on all query parameters before use
- **X-Frame-Options: DENY** — the app should not be embeddable in iframes
- **Referrer-Policy** — keep as `strict-origin-when-cross-origin`

Never introduce:
- `dangerouslySetInnerHTML` without sanitization
- Dynamic `require()` with user-controlled paths
- Unvalidated redirect URLs
- Logging of raw IP addresses or request headers to any persistent store

---

## SEO & Metadata

- Metadata is defined in `src/app/layout.tsx` using Next.js `Metadata` type
- OG and Twitter card images are generated via route handlers (`opengraph-image.tsx`, `twitter-image.tsx`)
- Sitemap and robots are in `src/app/sitemap.ts` and `src/app/robots.ts`
- Do not hardcode URLs — use environment variables or relative paths

---

## Deployment

### Docker

```bash
docker build -t my-ip .
docker run -p 3000:3000 my-ip
```

Multi-stage build: `deps` → `builder` → `runner` (Node 20 Alpine). Production image only includes built output and production dependencies.

### Vercel

The app is Vercel-ready. `@vercel/analytics` is integrated in `layout.tsx`. No additional configuration needed for basic deployment.

### Environment Variables

No required environment variables for basic operation. Optional:
- Geolocation is fetched from `https://ipapi.co` (no API key required for low volume)

---

## What NOT to Do

- Do not add server-side session storage or cookies
- Do not log or persist IP addresses on the server
- Do not add canvas/audio fingerprinting to browser diagnostics
- Do not bypass TypeScript strict checks with `@ts-ignore` or `any`
- Do not import from `next/dist/` internal paths
- Do not remove the rate limiter from the API route
- Do not add new UI component libraries without removing equivalent existing ones
- Do not create new files when editing an existing file is sufficient

---

## Related Documentation

- `docs/project/ARCHITECTURE.md` — detailed system design and data flow diagrams
- `docs/project/API.md` — full API reference with example responses
- `docs/project/PRIVACY.md` — privacy model details
- `docs/project/CONTRIBUTING.md` — contributor guidelines
- `AGENTS.md` — AI agent execution guide (task coordination)
- `docs/agents/` — multi-agent orchestration patterns
