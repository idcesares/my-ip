# Privacy

## What this app does
- Reads request IP headers server-side to determine your reachable address.
- Collects browser diagnostics in your browser at runtime.
- Stores up to 10 recent checks in localStorage only.

## What this app does not do
- No analytics/tracking scripts.
- No database persistence of request data.
- No third-party location lookup unless explicitly requested and enabled.

## Optional geolocation
`include=geo` is opt-in at request level. If enabled with `GEOLOCATION_PROVIDER=ipapi`, the server sends your detected IP to `ipapi.co`.