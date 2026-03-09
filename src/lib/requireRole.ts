// src/lib/requireRole.ts

export function requireRole(req: Request, allowed: string[]) {
  const role = req.headers.get("x-user-role");

  if (!role) {
    throw new Error("Unauthorized");
  }

  if (!allowed.includes(role)) {
    throw new Error("Forbidden");
  }

  return role;
}