// src/lib/role.ts
"use client";

export type Role = "admin" | "proceso" | "facturacion" | null;

/**
 * Lee el rol desde la etiqueta <meta name="x-user-role">
 * que el middleware coloca en el HTML antes del render.
 */
export function getRole(): Role {
  const meta = document.head.querySelector(
    "meta[name='x-user-role']"
  ) as HTMLMetaElement | null;

  if (!meta) return null;
  const r = (meta.content || "").trim().toLowerCase();

  if (r === "admin" || r === "proceso" || r === "facturacion") {
    return r;
  }
  return null;
}

export const can = {
  startPacking: (r: Role) => r === "admin" || r === "proceso",
  addBoxes: (r: Role) => r === "admin" || r === "proceso",
  editBoxes: (r: Role) => r === "admin" || r === "proceso",
  finalize: (r: Role) => r === "admin" || r === "proceso",
  pricing: (r: Role) => r === "admin",
  exportAny: (r: Role) => r === "admin",
  viewOnly: (r: Role) => r === "facturacion",
};
