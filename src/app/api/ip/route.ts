import { NextRequest, NextResponse } from "next/server";
import { detectIP, isValidDetection } from "@/lib/ip-detection";
import { rateLimit } from "@/lib/rate-limit";
import { ipQuerySchema } from "@/lib/schemas";
import type { APIError } from "@/types";

export const dynamic = "force-dynamic";

function toText(payload: Awaited<ReturnType<typeof detectIP>>) {
  const date = new Date(payload.timestamp).toISOString().replace("T", " ").replace(".000", "").replace("Z", " UTC");
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
  const ipKey =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const limit = rateLimit(ipKey);
  if (!limit.allowed) {
    const error: APIError = {
      error: "RATE_LIMITED",
      message: "Too many requests. Try again shortly.",
      statusCode: 429,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(error, {
      status: 429,
      headers: {
        "Retry-After": String(limit.retryAfter),
      },
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
      { status: 400 },
    );
  }

  const includeGeo = parsedQuery.data.include?.split(",").includes("geo") ?? false;
  const payload = await detectIP({ includeGeo });

  if (!isValidDetection(payload)) {
    return NextResponse.json(
      {
        error: "IP_DETECTION_FAILED",
        message: "Unable to detect a valid client IP from request headers.",
        statusCode: 500,
        timestamp: new Date().toISOString(),
      } satisfies APIError,
      { status: 500 },
    );
  }

  if (parsedQuery.data.format === "text") {
    return new NextResponse(toText(payload), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
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