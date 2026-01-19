import { cookies } from "next/headers";

export type Role = "admin" | "proceso" | "facturacion" | null;

/**
 * Obtiene el rol desde cookie (misma fuente que usa el frontend).
 * Compatible con el sistema actual de auth.
 */
export async function getRoleFromRequest(): Promise<Role> {
  const cookieStore = cookies();

  // Ajusta el nombre si tu cookie se llama distinto
  const roleCookie =
    cookieStore.get("qp_role")?.value ||
    cookieStore.get("role")?.value;

  if (!roleCookie) return null;

  const role = roleCookie.toLowerCase();

  if (role === "admin" || role === "proceso" || role === "facturacion") {
    return role;
  }

  return null;
}
