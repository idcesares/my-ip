import { z } from "zod";

export const ipQuerySchema = z.object({
  format: z.enum(["json", "text"]).default("json"),
  include: z.string().optional(),
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