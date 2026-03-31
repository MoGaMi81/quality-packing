import { cookies } from "next/headers";

export type Role = "admin" | "proceso" | "facturacion" | null;

export async function getRoleFromRequest(): Promise<Role> {
  const cookieStore = cookies();

  const sessionCookie = cookieStore.get("qp_session")?.value;

  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(decodeURIComponent(sessionCookie));

    const role = session?.role;

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