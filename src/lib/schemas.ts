import { z } from "zod";

const VALID_INCLUDE_TOKENS = new Set(["geo"]);

export const ipQuerySchema = z.object({
  format: z.enum(["json", "text"]).default("json"),
  include: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (value === undefined) return true;
        return value
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .every((t) => t === "" || VALID_INCLUDE_TOKENS.has(t));
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