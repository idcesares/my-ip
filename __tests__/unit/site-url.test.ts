import { describe, expect, it } from "vitest";
import { getSiteUrl } from "@/lib/site-url";

const env = (values: Record<string, string>) =>
  values as unknown as NodeJS.ProcessEnv;

describe("getSiteUrl", () => {
  it("prefers NEXT_PUBLIC_APP_URL and trims trailing slashes", () => {
    expect(
      getSiteUrl(
        env({
          NEXT_PUBLIC_APP_URL: "https://ip.example.org//",
          VERCEL_PROJECT_PRODUCTION_URL: "other.vercel.app",
        }),
      ),
    ).toBe("https://ip.example.org");
  });

  it("falls back to the Vercel production hostname", () => {
    expect(
      getSiteUrl(env({ VERCEL_PROJECT_PRODUCTION_URL: "my-ip.vercel.app" })),
    ).toBe("https://my-ip.vercel.app");
  });

  it("uses localhost outside production when nothing is configured", () => {
    expect(getSiteUrl(env({}))).toBe("http://localhost:3000");
    expect(getSiteUrl(env({ VERCEL_ENV: "preview" }))).toBe(
      "http://localhost:3000",
    );
  });

  it("fails a production build with no resolvable origin", () => {
    expect(() => getSiteUrl(env({ VERCEL_ENV: "production" }))).toThrow(
      /NEXT_PUBLIC_APP_URL/,
    );
  });
});
