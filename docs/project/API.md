# API Documentation

## Endpoint

`GET /api/ip`

Responses are dynamic and use `Cache-Control: no-store, no-cache, must-revalidate`.

## Query parameters

- `format=json` (default): structured IP information.
- `format=text`: a short human-readable report.
- `format=plain`: the detected IP address only, suitable for `curl` and scripts.
- `include=geo`: include location fields when Vercel request metadata is available.

Unknown formats or include tokens return `400`.

## Examples

```bash
curl https://myip.dcesares.dev/api/ip
curl 'https://myip.dcesares.dev/api/ip?format=plain'
curl 'https://myip.dcesares.dev/api/ip?format=text&include=geo'
```

Example JSON response:

```json
{
  "ip": "203.0.113.42",
  "ipVersion": "IPv4",
  "ipv4": "203.0.113.42",
  "ipv6": null,
  "isPublic": true,
  "source": "x-real-ip",
  "confidence": "high",
  "provenance": {
    "provider": "vercel",
    "header": "x-real-ip",
    "trusted": true,
    "forwarded": true
  },
  "category": "Public",
  "timestamp": "2026-02-08T00:00:00.000Z",
  "warnings": [],
  "location": null,
  "isp": null,
  "request": {
    "userAgent": "Mozilla/5.0...",
    "language": "en-US",
    "protocol": "https"
  }
}
```

Location fields are optional. On Vercel they are derived from platform request metadata through `@vercel/functions`; the application does not call a third-party IP-geolocation provider.
ISP and ASN fields are not enriched and remain `null`.

## Errors and request limits

- `400`: invalid query parameters.
- `405`: method not allowed.
- `500`: the request did not contain enough trustworthy information to determine an address.
- `429`: production request policy rejected the request. On Vercel this is configured at the WAF layer, so its response body may be platform-controlled.

Production abuse protection belongs in Vercel WAF. Local development does not emulate a durable, distributed rate limiter.

## Detection notes

- The result is the address used for this HTTP connection. VPNs, relays, corporate proxies, and Tor can change it.
- A single request arrives over either IPv4 or IPv6; it cannot prove that both address families are available. The production host is IPv4-only, so `ipv6` is `null` there (see `OPERATIONS.md`).
- `confidence` describes the request metadata source, not ownership of the address. On Vercel it drops to `low`, with a warning, when Cloudflare headers show another proxy sits in front (Vercel would then report the proxy's address).
- `provenance` reports how the request address was observed and whether that source is trusted in the current deployment mode.
- On Vercel, `@vercel/functions` resolves the platform-managed `x-real-ip` value. Outside Vercel, `cf-connecting-ip` is trusted only when `TRUSTED_PROXY_MODE=cloudflare` is explicitly enabled.
