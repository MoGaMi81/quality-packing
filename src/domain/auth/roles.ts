export const ROLES = {
  ADMIN: "admin",
  PROCESO: "proceso",
  FACTURACION: "facturacion",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];