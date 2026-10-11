# Operations

Vercel-specific facts, the production checks that exist, and the ones that must be done by hand. Facts marked with a date were verified against the production deployment on that date.

## Hosting facts

- Production runs on Vercel. `myip.dcesares.dev` is a CNAME straight to Vercel's DNS (no other proxy or CDN in front), and responses carry `server: Vercel`. (2026-10-11)
- **The site is IPv4-only.** The hostname resolves to A records only; there is no AAAA record, and Vercel's documentation states IPv6 is not supported for custom domains. A dual-stack visitor therefore always connects over IPv4, an IPv6-only visitor cannot load the site, and `ipv6` in `/api/ip` is `null` in production. The UI says "Not observable: this site is served over IPv4 only" for IPv6 (`src/lib/address-family.ts`); on other hosts it says "Not observed on this request".
- If Vercel adds IPv6 for custom domains, remove `vercel` from `IPV4_ONLY_PROVIDERS` in `src/lib/address-family.ts`. Re-check with: `dig AAAA myip.dcesares.dev` (an answer with only the CNAME means still IPv4-only).
- A real dual-stack comparison would need a probe hosted somewhere that serves IPv6 (a separate origin plus a `connect-src` change). This is deliberately not built.

## Abuse protection (Vercel WAF)

Status: **unverified.** The application has no in-process limiter by design (see `ARCHITECTURE.md`); protection depends entirely on a WAF rule that lives in the Vercel dashboard, not in this repository.

What was observed from outside (2026-10-11): 130 requests to `/api/ip` in 2.4 seconds from one IP all returned 200, with no `429` and no rate-limit headers. A blocking rule at Vercel's default threshold (100 requests per 60 seconds) would have triggered, so none is active at that threshold. A higher threshold or a log-only rule cannot be distinguished from outside.

Suggested rule (a starting point, not a measured value):

1. Vercel dashboard → project → **Firewall** → **Configure** → **+ New Rule**.
2. Condition: **Request Path** equals `/api/ip`.
3. Then: **Rate Limit**, Fixed Window, 60 s window, 60 requests, key **IP**. The page itself polls once a minute per open tab, so this leaves wide headroom.
4. Start with the **Log** action, review the Firewall overview for a few days, then switch to the default `429` action. **Review Changes → Publish** to apply.

Limits to know (Vercel docs): counters are tracked per region, so traffic spread across regions can exceed the configured limit in total; the Hobby plan allows one rate-limit rule per project; fixed-window counting and IP/JA4 keys are available on all plans.

Record the rule here once it exists (name, threshold, action, date).

## Proxies in front of Vercel

Vercel overwrites `X-Forwarded-For` and does not forward external client IPs, except for Enterprise "Trusted Proxy". Putting Cloudflare (or any proxy) in front of Vercel would make `/api/ip` report the proxy's address. The app cannot fix that, but when Cloudflare headers (`cf-connecting-ip`, `cf-ray`, or `cdn-loop: cloudflare`) appear on a Vercel request it lowers `confidence` to `low` and adds a warning. `TRUSTED_PROXY_MODE=cloudflare` applies only outside Vercel.

## Deployment verification

- `scripts/deployment-smoke.mjs` checks a deployed URL: trusted `vercel` provenance with high confidence, no upstream-proxy warning, optional geolocation, `no-store` on the API, `405` on `POST`, the security headers on `/`, an `<h1>`, and `robots.txt`.
- Run it by hand: `DEPLOY_URL=https://myip.dcesares.dev npm run test:deployment`.
- `.github/workflows/deployment-smoke.yml` runs it after each successful **Production** deployment. GitHub only runs `deployment_status` workflows from the default branch.
- Vercel's `environment_url` for a deployment is its unique `*.vercel.app` address, which is behind Deployment Protection (it redirects to Vercel's login). The first version of the workflow used that URL and failed on its first production run for exactly that reason. The workflow now checks the public production domain (`https://myip.dcesares.dev`, overridable with the `PRODUCTION_URL` repository variable). Because the domain can briefly still serve the previous build right after a deploy, add the repository secret `VERCEL_AUTOMATION_BYPASS_SECRET` (Protection Bypass for Automation) to test the exact deployment URL instead.
- Previews are not checked: they sit behind Deployment Protection and the script fails on them without `VERCEL_BYPASS_SECRET`.
- Geolocation can legitimately be missing for some client IPs; the script reports that as a notice, not a failure.

## Not covered anywhere yet

- Whether `master` requires CI to pass before merging, and whether Vercel production deploys wait for CI. Configure branch protection and Vercel Deployment Checks if a red CI run must block a deploy.
- Latency by region: `/api/ip` runs in a single default function region (`iad1` was observed). Measure from other continents before changing runtime or regions.
