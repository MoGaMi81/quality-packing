// src/lib/role.ts
export type Role = "proceso" | "facturacion" | "admin";

export const getRole = (): Role =>
  (process.env.NEXT_PUBLIC_ROLE as Role) || "admin";
export function getRoleClient(): "proceso" | "facturacion" | "admin" | null {
  const m = document.cookie.match(/(?:^|;\s*)role=([^;]+)/);
  return (m?.[1] as any) ?? null;
}
export const can = {
  startPacking: (r: Role) => r === "proceso" || r === "admin",
  addBoxes:     (r: Role) => r === "proceso" || r === "admin",
  editBoxes:    (r: Role) => r === "proceso" || r === "admin",
  finalize:     (r: Role) => r === "proceso" || r === "admin",
  pricing:      (r: Role) => r === "admin",
  exportAny:    (r: Role) => r === "admin",
  viewOnly:     (r: Role) => r === "facturacion",
};

