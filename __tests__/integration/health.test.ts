import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("/api/health route", () => {
  it("returns 200 with status ok", async () => {
    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
    expect(typeof body.uptime).toBe("number");
  });

  it("sets no-cache headers", async () => {
    const response = GET();

    expect(response.headers.get("Cache-Control")).toBe("no-store, no-cache, must-revalidate");
  });
});
