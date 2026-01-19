import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export type Role = "admin" | "proceso" | "facturacion" | null;

/**
 * Obtiene el rol REAL del usuario desde la sesión (cookie).
 * Usar SOLO en backend (API routes).
 */
export async function getRoleFromRequest(_req?: Request): Promise<Role> {
  // 🔑 Cookies de sesión (ajusta nombres si usas otros)
  const cookieStore = cookies();

  const accessToken =
    cookieStore.get("sb-access-token")?.value ||
    cookieStore.get("sb-access-token.0")?.value;

  const refreshToken =
    cookieStore.get("sb-refresh-token")?.value ||
    cookieStore.get("sb-refresh-token.0")?.value;

  if (!accessToken || !refreshToken) {
    return null;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Validar sesión
  const { data: authData, error: authErr } =
    await supabase.auth.getUser(accessToken);

  if (authErr || !authData?.user) {
    return null;
  }

  // Rol guardado en metadata del usuario
  const roleRaw =
    authData.user.user_metadata?.role ||
    authData.user.app_metadata?.role;

  if (!roleRaw) return null;

  const role = String(roleRaw).toLowerCase();
  if (role === "admin" || role === "proceso" || role === "facturacion") {
    return role;
  }

  return null;
}
