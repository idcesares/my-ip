# API Documentation

## Endpoint
`GET /api/ip`

## Query Parameters
- `format`: `json` (default) or `text`
- `include`: include `geo` for opt-in geolocation enrichment

## Example JSON Response
```json
{
  "ip": "203.0.113.42",
  "ipVersion": "IPv4",
  "ipv4": "203.0.113.42",
  "ipv6": null,
  "isPublic": true,
  "source": "x-forwarded-for",
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

## Error Responses
- `400` invalid query parameters
- `405` method not allowed
- `429` rate limited (`Retry-After` header)
- `500` detection failure/internal error