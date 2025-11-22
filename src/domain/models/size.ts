import { z } from "zod";

export const SizeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1), // "3/4-1", "10-20", "40UP", etc.
});

export type Size = z.infer<typeof SizeSchema>;
