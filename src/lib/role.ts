// src/lib/role.ts
"use client";

export type Role = "proceso" | "facturacion" | "admin";

// Obtiene valor de cualquier cookie
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null; // evita error SSR
  try {
    const cookies = document.cookie.split(";").map(c => c.trim());
    const row = cookies.find(c => c.startsWith(name + "="));
    if (!row) return null;
    return decodeURIComponent(row.split("=")[1] || "");
  } catch {
    return null;
  }
}

// Lee rol desde cookie qp_session
export function getRole(): Role | null {
  const raw = getCookie("qp_session");
  if (!raw) return null;

  try {
    const json = JSON.parse(raw);  // SIN base64
    const role = String(json.role || "").toLowerCase();

    if (role === "proceso" || role === "facturacion" || role === "admin") {
      return role;
    }
    return null;
  } catch (e) {
    console.error("ERROR PARSEANDO COOKIE:", e);
    return null;
  }
}

export const can = {
  startPacking: (r: Role | null) => r === "proceso" || r === "admin",
  addBoxes:     (r: Role | null) => r === "proceso" || r === "admin",
  editBoxes:    (r: Role | null) => r === "proceso" || r === "admin",
  finalize:     (r: Role | null) => r === "proceso" || r === "admin",
  pricing:      (r: Role | null) => r === "admin",
  exportAny:    (r: Role | null) => r === "admin",
  viewOnly:     (r: Role | null) => r === "facturacion",
};
