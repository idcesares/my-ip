import { describe, expect, it } from "vitest";
import {
  EMPTY_HEADERS,
  PROBE_SAMPLES,
  networkSignature,
  probeCurrentPage,
} from "@/lib/browser-snapshot";

function response(headers: Record<string, string>) {
  return { headers: new Headers(headers) } as Response;
}

/** Each probe sample reads the clock twice: before and after the request. */
function clock(durations: number[]) {
  let tick = 0;
  let calls = 0;
  return () => {
    if (calls % 2 === 1) tick += durations[(calls - 1) / 2];
    calls++;
    return tick;
  };
}

describe("probeCurrentPage", () => {
  it("reports the median and minimum of several samples", async () => {
    const fetchImpl = (async () =>
      response({
        "content-security-policy": "default-src 'self'",
        "strict-transport-security": "max-age=31536000",
      })) as unknown as typeof fetch;

    const probe = await probeCurrentPage({
      samples: 5,
      fetchImpl,
      now: clock([90, 40, 60, 45, 300]),
      path: "/",
    });

    expect(probe.status).toBe("measured");
    expect(probe.samples).toBe(5);
    expect(probe.pageFetchMinMs).toBe(40);
    expect(probe.pageFetchMs).toBe(60);
    expect(probe.responseHeaders.csp).toBe("default-src 'self'");
    expect(probe.responseHeaders.strictTransportSecurity).toBe(
      "max-age=31536000",
    );
    expect(probe.responseHeaders.referrerPolicy).toBeNull();
    expect(Number.isNaN(Date.parse(probe.probedAt))).toBe(false);
  });

  it("issues one HEAD request per sample with no-store", async () => {
    const calls: [string, RequestInit | undefined][] = [];
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      calls.push([url, init]);
      return response({});
    }) as unknown as typeof fetch;

    await probeCurrentPage({ fetchImpl, path: "/x" });

    expect(calls).toHaveLength(PROBE_SAMPLES);
    expect(calls.every(([url]) => url === "/x")).toBe(true);
    expect(
      calls.every(
        ([, init]) => init?.method === "HEAD" && init.cache === "no-store",
      ),
    ).toBe(true);
  });

  it("keeps samples taken before a failure", async () => {
    let call = 0;
    const fetchImpl = (async () => {
      call++;
      if (call > 2) throw new TypeError("network down");
      return response({ "x-frame-options": "DENY" });
    }) as unknown as typeof fetch;

    const probe = await probeCurrentPage({ samples: 5, fetchImpl, path: "/" });

    expect(probe.status).toBe("measured");
    expect(probe.samples).toBe(2);
    expect(probe.responseHeaders.xFrameOptions).toBe("DENY");
  });

  it("reports unavailable when the first request fails", async () => {
    const fetchImpl = (async () => {
      throw new TypeError("offline");
    }) as unknown as typeof fetch;

    const probe = await probeCurrentPage({ fetchImpl, path: "/" });

    expect(probe).toMatchObject({
      status: "unavailable",
      pageFetchMs: null,
      pageFetchMinMs: null,
      samples: 0,
      responseHeaders: EMPTY_HEADERS,
    });
  });
});

describe("networkSignature", () => {
  it("changes when any indicator changes and tolerates a missing API", () => {
    expect(networkSignature(null)).toBe("||||");
    const base = { effectiveType: "4g", downlink: 10, rtt: 50 };
    expect(networkSignature(base)).not.toBe(
      networkSignature({ ...base, rtt: 100 }),
    );
    expect(networkSignature(base)).toBe(networkSignature({ ...base }));
  });
});
