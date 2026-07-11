# Domain Context

## Reachable address

The public IP address a visitor used for the current HTTP request. It describes the network path visible to this deployment, not a permanent identity or a guaranteed ISP-origin address.

## Request observation

The factual result produced from a single incoming request: reachable address, address family, routability category, trusted platform provenance, request protocol, and optional coarse geolocation. It must not infer VPN, Tor, relay, or anonymity status from transport headers alone.

## Browser diagnostics

Measurements computed locally by the visitor's browser. A value can be observed, unsupported, or not yet measured; absence of a measurement is not evidence that a capability or security control is missing.

## Active test

A diagnostic that performs an explicit operation, such as a WebRTC candidate check or an opt-in location reveal. Active tests disclose their limits and never run silently when they could expose additional information.

## Local history

Up to ten recent request observations stored only in the visitor's browser storage. It is never server-side history and must be disclosed wherever the privacy contract is summarized.

## Privacy contract

The product guarantee that there are no analytics or tracking scripts, no database persistence of request observations, no silent third-party IP disclosure, and no browser fingerprint hash generation.
