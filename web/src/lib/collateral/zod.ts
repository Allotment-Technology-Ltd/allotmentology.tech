import { z } from "zod";

import { COLLATERAL_KINDS } from "./constants";

const tagsFromString = z
  .string()
  .optional()
  .transform((raw) => {
    if (raw == null || raw.trim() === "") return [] as string[];
    return raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 40);
  });

export const collateralFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(512),
  kind: z.enum(COLLATERAL_KINDS),
  body: z.string().max(500_000, "Body is too large"),
  tags: tagsFromString,
  approved: z.boolean(),
});

export type CollateralFormValues = z.infer<typeof collateralFormSchema>;
