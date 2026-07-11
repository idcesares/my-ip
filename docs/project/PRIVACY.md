# Privacy

## Data flow

- The server reads the request metadata needed to return the address used for the current connection.
- On Vercel, IP and optional location fields come from platform request metadata exposed by `@vercel/functions`.
- Browser, display, network, permission-state, and security-header diagnostics are computed in the browser.
- Up to 10 recent checks are stored in that browser's `localStorage`. Clearing site data or using the in-app clear action removes them.
- Advanced diagnostics run only after the user enables them. Permission state is read without requesting a permission grant.
- The optional WebRTC address exposure test runs only after the user starts it. It contacts the configured public Google STUN servers, which necessarily receive a network request and its source address, to gather ICE candidates.
- WebRTC candidates are compared with the address used for the current HTTP request. The same public address is expected exposure; additional public addresses or literal private addresses are called out separately.

## What the application does not do

- No analytics, advertising, tracking pixels, or tracking scripts.
- No application database and no server-side history of checks.
- No third-party IP-geolocation lookup. Optional location fields use Vercel's request metadata.
- No ISP, ASN, reputation, or ownership enrichment request.
- No canvas, audio, or WebGL fingerprint hashes; no plugin or font enumeration.
- No permission prompts initiated by diagnostics.
- No WebRTC test on initial page load or without an explicit user action.

## Hosting and operational logs

Vercel necessarily processes requests to host the application and may retain operational logs according to the deployment owner's Vercel settings and Vercel's policies. Those platform controls are separate from application analytics; this repository does not add an analytics SDK.

## Limitations

The displayed address can be a VPN, Tor exit, relay, carrier-grade NAT, or corporate proxy address. Location is approximate platform metadata and may be missing. A browser connection exposes only the address family used for that request.

Network Information API values are rounded browser estimates and may be unavailable. The page-fetch duration includes browser and server work, so it is not a network ping. Permission values are effective states for this origin and can be affected by browser policy. WebRTC candidate gathering is a short observation, not proof that no other address can ever be exposed.
