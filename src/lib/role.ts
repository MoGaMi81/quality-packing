// src/lib/role.ts
"use client";

export type Role = "admin" | "proceso" | "facturacion" | null;

/**
 * Lee el rol desde <body data-role="...">
 * que fue inyectado por middleware → layout
 */
export function getRole(): Role {
  if (typeof document === "undefined") return null;
  const r = document.body.dataset.role;
  if (!r) return null;

  const role = r.toLowerCase();
  if (role === "admin" || role === "proceso" || role === "facturacion") {
    return role;
  }
  return null;
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
