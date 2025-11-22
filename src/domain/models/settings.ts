import { z } from "zod";

export const SettingsSchema = z.object({
  invoice_suffix: z.string().min(1),      // e.g., "A"
  last_invoice_number: z.string().min(1), // e.g., "1010"
});

export type Settings = z.infer<typeof SettingsSchema>;
