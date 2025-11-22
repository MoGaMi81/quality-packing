import { z } from "zod";

export const ClientsSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  address: z.string().optional(),
  tax_id: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type Clients = z.infer<typeof ClientsSchema>;
