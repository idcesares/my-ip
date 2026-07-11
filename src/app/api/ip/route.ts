import { NextRequest, NextResponse } from "next/server";
import { detectIP, isValidDetection } from "@/lib/ip-detection";
import { ipQuerySchema } from "@/lib/schemas";
import type { APIError } from "@/types";

export const dynamic = "force-dynamic";

const PRIVATE_RESPONSE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "X-Content-Type-Options": "nosniff",
} as const;

function jsonError(error: APIError, headers: Record<string, string> = {}) {
  return NextResponse.json(error, {
    status: error.statusCode,
    headers: { ...PRIVATE_RESPONSE_HEADERS, ...headers },
  });
}

function toText(payload: Awaited<ReturnType<typeof detectIP>>) {
  const d = new Date(payload.timestamp);
  const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")} UTC`;
  return [
    `Your IP Address: ${payload.ip} (${payload.ipVersion})`,
    payload.location
      ? `Location: ${payload.location.city ?? "Unknown"}, ${payload.location.region ?? "Unknown"}, ${payload.location.country ?? "Unknown"}`
      : "Location: Not requested",
    payload.isp
      ? `ISP: ${payload.isp.name ?? "Unknown"} (${payload.isp.asn ?? "N/A"})`
      : "ISP: Not available",
    `Timestamp: ${date}`,
  ].join("\n");
}

export async function GET(request: NextRequest) {
  // Production abuse protection belongs to Vercel WAF. An in-process Map is
  // not a rate limiter across autoscaled, isolated Function instances.
  const parsedQuery = ipQuerySchema.safeParse({
    format: request.nextUrl.searchParams.get("format") ?? "json",
    include: request.nextUrl.searchParams.get("include") ?? undefined,
  });

  if (!parsedQuery.success) {
    return jsonError({
      error: "INVALID_QUERY",
      message: "Invalid query parameters.",
      statusCode: 400,
      timestamp: new Date().toISOString(),
    });
  }

  const includeGeo =
    parsedQuery.data.include
      ?.split(",")
      .map((value) => value.trim().toLowerCase())
      .includes("geo") ?? false;
  const payload = await detectIP(request, { includeGeo });

  if (!isValidDetection(payload)) {
    return jsonError({
      error: "IP_DETECTION_FAILED",
      message:
        "Unable to detect a valid client IP from trusted request headers.",
      statusCode: 500,
      timestamp: new Date().toISOString(),
    });
  }

  if (parsedQuery.data.format === "plain") {
    return new NextResponse(payload.ip, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        ...PRIVATE_RESPONSE_HEADERS,
      },
    });
  }

  if (parsedQuery.data.format === "text") {
    return new NextResponse(toText(payload), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        ...PRIVATE_RESPONSE_HEADERS,
      },
    });
  }

  return NextResponse.json(payload, { headers: PRIVATE_RESPONSE_HEADERS });
}

const methodNotAllowed = () =>
  jsonError(
    {
      error: "METHOD_NOT_ALLOWED",
      message: "Only GET is supported on this endpoint.",
      statusCode: 405,
      timestamp: new Date().toISOString(),
    },
    { Allow: "GET" },
  );

export const POST = methodNotAllowed;
export const PUT = methodNotAllowed;
export const DELETE = methodNotAllowed;
