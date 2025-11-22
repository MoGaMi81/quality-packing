import { z } from "zod";

export const SpeciesCodeSchema = z.object({
  code: z.string().min(1),          // e.g., "ARS1-22"
  species_id: z.string().uuid(),    // FK a species.json
  size_id: z.string().uuid(),       // FK a sizes.json
  form_id: z.string().uuid()        // FK a forms.json
});

export type SpeciesCode = z.infer<typeof SpeciesCodeSchema>;
