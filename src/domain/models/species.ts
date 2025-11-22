import { z } from "zod";

export const SpeciesSchema = z.object({
  id: z.string().uuid(),
  code: z.string().optional(),      // 👈 opcional
  name_en: z.string().min(1),
  scientific_name: z.string().optional(),
  form_default: z.string().optional(),
});

export type Species = z.infer<typeof SpeciesSchema>;
