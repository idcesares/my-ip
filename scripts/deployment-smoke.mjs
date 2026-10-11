// Verifies Vercel-specific behavior on a *deployed* URL, which the local
// production-server smoke test cannot: trusted Vercel provenance, platform
// geolocation, and the headers served by the real edge.
//
//   DEPLOY_URL=https://myip.example.org node scripts/deployment-smoke.mjs
//
// VERCEL_BYPASS_SECRET (optional) is Vercel's "Protection Bypass for
// Automation" secret, needed for preview deployments behind Deployment
// Protection.
import process from "node:process";

const origin = (process.env.DEPLOY_URL ?? "").replace(/\/+$/, "");
const bypass = process.env.VERCEL_BYPASS_SECRET;

if (!/^https:\/\//.test(origin)) {
  console.error("DEPLOY_URL must be an https:// URL.");
  process.exit(2);
}

const failures = [];
const notices = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function get(path, init = {}, attempts = 4) {
  const headers = { ...(init.headers ?? {}) };
  if (bypass) headers["x-vercel-protection-bypass"] = bypass;

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(`${origin}${path}`, {
        ...init,
        headers,
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
      });
      const redirected = response.status >= 300 && response.status < 400;
      if (response.status === 401 || response.status === 403 || redirected) {
        const where = redirected
          ? ` (redirects to ${response.headers.get("location") ?? "another URL"})`
          : "";
        throw Object.assign(
          new Error(
            `${path} returned ${response.status}${where}; the deployment is probably behind Deployment Protection. Set VERCEL_BYPASS_SECRET or test a public deployment.`,
          ),
          { fatal: true },
        );
      }
      if (response.status < 500) return response;
      lastError = new Error(`${path} returned ${response.status}`);
    } catch (error) {
      if (error.fatal) throw error;
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
  }
  throw lastError;
}

try {
  // Request observation through Vercel's platform headers.
  const json = await get("/api/ip?format=json&include=geo");
  check(json.status === 200, `/api/ip returned ${json.status}`);
  const body = await json.json();
  check(
    body.provenance?.provider === "vercel",
    `provider was ${body.provenance?.provider}, expected vercel`,
  );
  check(
    body.provenance?.trusted === true,
    "Vercel provenance was not marked trusted",
  );
  check(
    body.confidence === "high",
    `confidence was ${body.confidence}, expected high`,
  );
  check(
    !(body.warnings ?? []).some((warning) => /cloudflare/i.test(warning)),
    "an upstream-proxy (Cloudflare) warning is present; Vercel may be reporting a proxy address",
  );
  check(body.request?.protocol === "https", "request protocol was not https");
  check(
    /cache-control/i.test([...json.headers.keys()].join(",")) &&
      /no-store/.test(json.headers.get("cache-control") ?? ""),
    "/api/ip is not no-store",
  );

  if (body.location) {
    check(
      Boolean(body.location.country),
      "location present but country is empty",
    );
  } else {
    notices.push(
      "Location was null: this client IP has no Vercel geolocation data (not treated as a failure).",
    );
  }

  const plain = await get("/api/ip?format=plain");
  check(
    plain.status === 200 && (await plain.text()).trim() === body.ip,
    "format=plain did not match the JSON address",
  );

  const post = await get("/api/ip", { method: "POST" });
  check(
    post.status === 405 && post.headers.get("allow") === "GET",
    "POST /api/ip should return 405 with Allow: GET",
  );

  // Headers served by the real edge for the page shell.
  const home = await get("/");
  check(home.status === 200, `/ returned ${home.status}`);
  for (const name of [
    "content-security-policy",
    "strict-transport-security",
    "x-content-type-options",
    "x-frame-options",
    "referrer-policy",
    "permissions-policy",
  ]) {
    check(Boolean(home.headers.get(name)), `/ is missing the ${name} header`);
  }
  check((await home.text()).includes("<h1"), "/ did not render an <h1>");

  const robots = await get("/robots.txt");
  check(
    robots.status === 200 && /sitemap:/i.test(await robots.text()),
    "/robots.txt is missing a Sitemap line",
  );
} catch (error) {
  failures.push(error.message);
}

for (const notice of notices) console.log(`notice: ${notice}`);
if (failures.length > 0) {
  console.error(`Deployment smoke FAILED for ${origin}:`);
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log(`Deployment smoke passed for ${origin}.`);
