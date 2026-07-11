import { spawn } from "node:child_process";
import { once } from "node:events";
import process from "node:process";
import { fileURLToPath } from "node:url";

const host = "127.0.0.1";
const port = Number(process.env.SMOKE_PORT ?? 3111);
const origin = `http://${host}:${port}`;
const nextBin = new URL("../node_modules/next/dist/bin/next", import.meta.url);
const output = [];

const server = spawn(
  process.execPath,
  [fileURLToPath(nextBin), "start", "--hostname", host, "--port", String(port)],
  {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    env: { ...process.env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

for (const stream of [server.stdout, server.stderr]) {
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    output.push(chunk);
    if (output.join("").length > 8_000) output.shift();
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer() {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Production server exited early.\n${output.join("")}`);
    }
    try {
      const response = await fetch(`${origin}/api/ip?format=plain`, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(
    `Production server did not become ready.\n${output.join("")}`,
  );
}

async function run() {
  await waitForServer();

  const page = await fetch(origin);
  const html = await page.text();
  assert(page.status === 200, "Home page did not return 200");
  assert(
    page.headers.get("content-security-policy")?.includes("object-src 'none'"),
    "Home page CSP is missing the object-src restriction",
  );
  assert(
    !html.includes("vercel/analytics"),
    "Analytics code appeared in production HTML",
  );

  const jsonResponse = await fetch(`${origin}/api/ip`);
  const payload = await jsonResponse.json();
  assert(jsonResponse.status === 200, "JSON API did not return 200");
  assert(
    jsonResponse.headers.get("cache-control")?.includes("no-store"),
    "JSON API is cacheable",
  );
  assert(
    typeof payload.ip === "string" && payload.ip.length > 0,
    "JSON API omitted the IP",
  );
  assert(
    payload.provenance && typeof payload.provenance.trusted === "boolean",
    "JSON API omitted provenance",
  );

  const plainResponse = await fetch(`${origin}/api/ip?format=plain`);
  assert(
    (await plainResponse.text()) === payload.ip,
    "Plain API disagrees with JSON API",
  );

  const textResponse = await fetch(`${origin}/api/ip?format=text`);
  assert(
    (await textResponse.text()).includes("Your IP Address:"),
    "Text report format is invalid",
  );

  const invalidResponse = await fetch(`${origin}/api/ip?format=xml`);
  assert(invalidResponse.status === 400, "Invalid API format was not rejected");
  assert(
    invalidResponse.headers.get("cache-control")?.includes("no-store"),
    "API errors are cacheable",
  );

  const methodResponse = await fetch(`${origin}/api/ip`, { method: "POST" });
  assert(
    methodResponse.status === 405,
    "Unsupported method did not return 405",
  );
  assert(
    methodResponse.headers.get("allow") === "GET",
    "405 response omitted Allow: GET",
  );

  process.stdout.write("Production smoke test passed.\n");
}

try {
  await run();
} finally {
  if (server.exitCode === null) server.kill("SIGTERM");
  await Promise.race([
    once(server, "exit"),
    new Promise((resolve) => setTimeout(resolve, 3_000)),
  ]);
  if (server.exitCode === null) server.kill("SIGKILL");
}
