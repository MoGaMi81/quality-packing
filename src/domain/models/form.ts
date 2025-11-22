import { z } from "zod";

export const FormSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1), // "W&G", "HG", etc.
});

export type FormModel = z.infer<typeof FormSchema>;
