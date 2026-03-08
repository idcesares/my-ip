import { NextRequest, NextResponse } from "next/server";
import { detectIP, extractClientIP, isValidDetection } from "@/lib/ip-detection";
import { rateLimit, type RateLimitResult } from "@/lib/rate-limit";
import { ipQuerySchema } from "@/lib/schemas";
import type { APIError } from "@/types";

export const dynamic = "force-dynamic";

function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
  };
  if (result.resetAt > 0) {
    headers["X-RateLimit-Reset"] = String(Math.ceil(result.resetAt / 1000));
  }
  if (!result.allowed) {
    headers["Retry-After"] = String(result.retryAfter);
  }
  return headers;
}

function toText(payload: Awaited<ReturnType<typeof detectIP>>) {
  const d = new Date(payload.timestamp);
  const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")} UTC`;
  return [
    `Your IP Address: ${payload.ip} (${payload.ipVersion})`,
    payload.location
      ? `Location: ${payload.location.city ?? "Unknown"}, ${payload.location.region ?? "Unknown"}, ${payload.location.country ?? "Unknown"}`
      : "Location: Not requested",
    payload.isp ? `ISP: ${payload.isp.name ?? "Unknown"} (${payload.isp.asn ?? "N/A"})` : "ISP: Not requested",
    `Timestamp: ${date}`,
  ].join("\n");
}

export async function GET(request: NextRequest) {
  const limit = rateLimit(extractClientIP(request.headers));
  if (!limit.allowed) {
    const error: APIError = {
      error: "RATE_LIMITED",
      message: "Too many requests. Try again shortly.",
      statusCode: 429,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(error, {
      status: 429,
      headers: rateLimitHeaders(limit),
    });
  }

  const parsedQuery = ipQuerySchema.safeParse({
    format: request.nextUrl.searchParams.get("format") ?? "json",
    include: request.nextUrl.searchParams.get("include") ?? undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: "INVALID_QUERY",
        message: "Invalid query parameters.",
        statusCode: 400,
        timestamp: new Date().toISOString(),
      } satisfies APIError,
      { status: 400, headers: rateLimitHeaders(limit) },
    );
  }

  const includeGeo =
    parsedQuery.data.include
      ?.split(",")
      .map((value) => value.trim().toLowerCase())
      .includes("geo") ?? false;
  const payload = await detectIP({ includeGeo });

  if (!isValidDetection(payload)) {
    return NextResponse.json(
      {
        error: "IP_DETECTION_FAILED",
        message: "Unable to detect a valid client IP from request headers.",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      } satisfies APIError,
      { status: 500, headers: rateLimitHeaders(limit) },
    );
  }

  if (parsedQuery.data.format === "plain") {
    return new NextResponse(payload.ip, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        ...rateLimitHeaders(limit),
      },
    });
  }

  if (parsedQuery.data.format === "text") {
    return new NextResponse(toText(payload), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        ...rateLimitHeaders(limit),
      },
    });
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      ...rateLimitHeaders(limit),
    },
  });
}

const methodNotAllowed = () =>
  NextResponse.json(
    {
      error: "METHOD_NOT_ALLOWED",
      message: "Only GET is supported on this endpoint.",
      statusCode: 405,
      timestamp: new Date().toISOString(),
    } satisfies APIError,
    { status: 405 },
  );

export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const DELETE = methodNotAllowed;
