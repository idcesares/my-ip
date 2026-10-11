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

export const historyEntrySchema = z.object({
  id: z.string(),
  ip: z.string(),
  ipVersion: z.string(),
  timestamp: z.string(),
  location: z.string().nullable().optional(),
});

export const historyArraySchema = z.array(historyEntrySchema);
