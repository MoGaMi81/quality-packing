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

export function getRole() {
  return getSession()?.role ?? null;
}