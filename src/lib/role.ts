// src/lib/role.ts
"use client";

export type Role = "proceso" | "facturacion" | "admin";

export function getRole(): Role | null {
  const raw = document.cookie
    .split("; ")
    .find(x => x.startsWith("qp_session="));

  if (!raw) return null;

  try {
    const base64 = raw.split("=")[1];
    const json = JSON.parse(atob(base64));
    const role = (json.rol || json.role || "").toLowerCase();
    return role as Role;
  } catch {
    return null;
  }
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


