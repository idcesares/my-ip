import { z } from "zod";

const VALID_INCLUDE_TOKENS = new Set(["geo"]);

export const ipQuerySchema = z.object({
  format: z.enum(["json", "text", "plain"]).default("json"),
  include: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (value === undefined) return true;
        const tokens = value
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter((t) => t !== "");
        return tokens.every((t) => VALID_INCLUDE_TOKENS.has(t));
      },
      { message: "Unknown include parameter. Allowed values: geo" },
    ),
});

export const geoSchema = z.object({
  city: z.string().nullable(),
  region: z.string().nullable(),
  country: z.string().nullable(),
  timezone: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  isp: z.string().nullable(),
  asn: z.string().nullable(),
  org: z.string().nullable(),
});

export const historyEntrySchema = z.object({
  ip: z.string(),
  ipVersion: z.string(),
  timestamp: z.string(),
  source: z.string().optional(),
  confidence: z.string().optional(),
});