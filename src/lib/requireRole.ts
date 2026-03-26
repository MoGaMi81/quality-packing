export function requireRole(req: Request, roles: string[]) {
  const cookie = req.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith("qp_session="));

  if (!cookie) {
    throw new Error("Unauthorized");
  }

  try {
    const value = decodeURIComponent(cookie.split("=")[1]);
    const session = JSON.parse(value);

    if (!roles.includes(session.role)) {
      throw new Error("Forbidden");
    }

    return session;
  } catch {
    throw new Error("Unauthorized");
  }
}