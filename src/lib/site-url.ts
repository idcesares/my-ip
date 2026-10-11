/**
 * Canonical origin for metadata, robots, and the sitemap. A production deploy
 * with no resolvable origin fails the build instead of publishing example.com.
 */
export function getSiteUrl(env: NodeJS.ProcessEnv = process.env): string {
  const explicit = env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercelHost = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelHost) return `https://${vercelHost}`;

  if (env.VERCEL_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL must be set for production builds (used for canonical, sitemap, and robots URLs).",
    );
  }

  return "http://localhost:3000";
}
