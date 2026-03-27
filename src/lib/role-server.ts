import { cookies } from "next/headers";

export type Role = "admin" | "proceso" | "facturacion" | null;

export async function getRoleFromRequest(): Promise<Role> {
  const cookieStore = cookies();
  const session = cookieStore.get("qp_session");

  if (!session?.value) return null;

  try {
    const parsed = JSON.parse(session.value);

    const role = parsed?.role;

    if (
      role === "admin" ||
      role === "proceso" ||
      role === "facturacion"
    ) {
      return role;
    }

    return null;
  } catch {
    return null;
  }
}