# Current Project Specification

## Product promise

`myip.dcesares.dev` gives a visitor an immediate, honest view of the address and browser-visible signals exposed by the current connection. The experience should be fast, accessible, calm, and useful to both casual users and technical operators.

## Core experience

- Show the address used for the current HTTP request, its family, trustworthy provenance, and optional Vercel location metadata.
- Support copy, share, JSON export, report-text export, and plain-IP API output.
- Explain VPN, Tor, proxy, CGNAT, relay, dual-stack, and metadata limitations.
- Store at most 10 recent checks in the current browser only.
- Provide basic browser/network/security signals with concise tooltips.
- Gate advanced probes behind a user control.
- Run WebRTC candidate gathering only after explicit action and compare observations with the HTTP request address.
- Present descriptive findings instead of a misleading numeric privacy score.

## API

`GET /api/ip` supports `format=json`, `format=text`, and `format=plain`. It validates input, disables caching, returns method guidance for unsupported methods, and never accepts a client-provided IP as authoritative. See `docs/project/API.md`.

## Diagnostic correctness

- Distinguish server-observed facts from browser-reported hints.
- Label rounded Network Information values as estimates.
- Label same-origin request timing as total page-fetch duration.
- Render unsupported and unavailable states explicitly.
- Treat permission queries as effective origin states without initiating prompts.
- Do not infer VPN, ISP, ASN, anonymity, or security guarantees from insufficient data.
- Explain WebRTC same-address, additional-public, literal-private, mDNS, timeout, and no-candidate outcomes separately.

## Privacy and security

- No analytics, advertising, tracking pixels, fingerprint hashes, or third-party IP enrichment.
- No application database or server-side check history.
- Static CSP and defense-in-depth headers are configured in Next.js.
- Production abuse controls belong in Vercel WAF.
- Opt-in features disclose third-party network contact before or at execution.
- Operational platform logs are acknowledged separately from application analytics.

## Design and accessibility

- Mobile-first, responsive, theme-aware, keyboard accessible, and WCAG 2.1 AA oriented.
- Preserve readable value widths; long IPv6 addresses and labels must wrap safely.
- Status is communicated by text and structure, not color alone.
- Loading, error, unsupported, timeout, and partial states must remain usable.
- Prefer shadcn/ui primitives, Lucide icons, Geist typography, and existing CSS variables.

## Quality bar

- Strict TypeScript and lint pass.
- Critical pure logic meets enforced coverage thresholds.
- API routes have integration coverage.
- Production build and built-server smoke suite pass.
- Desktop and narrow-viewport browser checks cover initial, advanced, and WebRTC states.
- Documentation and knowledge graph match runtime behavior.
