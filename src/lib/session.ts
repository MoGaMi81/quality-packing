export type SessionData = {
  user_id: string;
  email: string;
  role: "admin" | "proceso" | "facturacion";
};

export function getSession(): SessionData | null {
  if (typeof document === "undefined") return null;

  const raw = document.cookie
    .split("; ")
    .find((c) => c.startsWith("qp_session="))
    ?.split("=")[1];

  if (!raw) return null;

  try {
    return JSON.parse(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

export function getRoleSafe() {
  const session = getSession();

  // 🔥 prioridad nueva
  if (session?.role) return session.role;

  // 🧯 fallback viejo (NO BORRAR AÚN)
  const roleCookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith("role="));

  return roleCookie?.split("=")[1] || null;
}

export function getRole() {
  return getSession()?.role ?? null;
}