"use client";

export type Role = "proceso" | "facturacion" | "admin";

// Lee el rol desde la cookie qp_session
export function getRole(): Role | null {
  const raw = document.cookie
    .split("; ")
    .find(x => x.startsWith("qp_session="));

  if (!raw) return null;

  try {
    const base64 = raw.split("=")[1];
    const json = JSON.parse(atob(base64));

    const role = (json.role || json.rol || "").toLowerCase();
    if (role === "proceso" || role === "facturacion" || role === "admin") {
      return role as Role;
    }
    return null;
  } catch {
    return null;
  }
}

// 🔥 VOLVEMOS A EXPORTAR 'can'
export const can = {
  startPacking: (r: Role) => r === "proceso" || r === "admin",
  addBoxes:     (r: Role) => r === "proceso" || r === "admin",
  editBoxes:    (r: Role) => r === "proceso" || r === "admin",
  finalize:     (r: Role) => r === "proceso" || r === "admin",
  pricing:      (r: Role) => r === "admin",
  exportAny:    (r: Role) => r === "admin",
  viewOnly:     (r: Role) => r === "facturacion",
};



