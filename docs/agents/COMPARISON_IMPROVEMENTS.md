# Implementation Improvements

The current application intentionally differs from its original planning package.

## Correctness

- Trusted request provenance replaces optimistic proxy-header interpretation.
- Browser connection fields are described as estimates, not measurements.
- The same-origin probe is page-fetch duration, not “page RTT.”
- Unsupported values are explicit; unreliable DNT reporting was removed.
- WebRTC results compare candidate addresses with the HTTP request address instead of labeling every candidate a leak.
- Diagnostic findings are descriptive and evidence-based rather than a synthetic privacy score.

## Privacy and operations

- Vercel request metadata replaces third-party IP enrichment.
- Local history is capped and never synchronized to a server database.
- Vercel Analytics was removed to match the no-tracking contract.
- WebRTC is opt-in and discloses public STUN-server contact.
- Static headers live in Next.js configuration, while distributed rate limiting belongs in Vercel WAF.

## Product and design

- The interface uses responsive shadcn/ui primitives, accessible controls, theme support, explanatory tooltips, and clear unsupported/partial states.
- Metadata, structured data, sitemap, robots, and generated social images support discoverability.
- JSON, report-text, and plain API representations serve both people and scripts.

## Quality

- Pure diagnostic logic is separated from browser I/O for deterministic testing.
- Unit, component, route integration, coverage thresholds, production build, and built-server smoke validation are enforced in CI.
- Runtime and agent documentation now share the same architecture and measurement vocabulary.
