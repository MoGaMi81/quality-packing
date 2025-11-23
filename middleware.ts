// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC = ["/login", "/api/auth/login", "/api/auth/debug-users"];

const ACL: Record<string, Array<"admin"|"proceso"|"facturacion">> = {
  "/admin": ["admin"],
  "/packing": ["admin", "proceso"],
  "/packing/view": ["admin", "facturacion"],
  "/catalogs": ["admin"]
};

function readUser(req: NextRequest) {
  const cookie = req.cookies.get("qp_session")?.value;
  if (!cookie) return null;

  try {
    return JSON.parse(Buffer.from(cookie, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC.some(p => pathname.startsWith(p)))
    return NextResponse.next();

  const user = readUser(req);
  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 🔥 FIX: Detectar tu campo real correcto
  const role = String(user.rol || user.role || "").toLowerCase();

  if (pathname === "/") return NextResponse.next();

  let matched = Object.keys(ACL)
    .filter(p => pathname === p || pathname.startsWith(p + "/"))
    .sort((a, b) => b.length - a.length)[0];

  if (!matched) return NextResponse.next();

  const allow = ACL[matched].includes(role as any);
  if (allow) return NextResponse.next();

  // Redirección por rol
  const url = req.nextUrl.clone();
  if (role === "proceso") url.pathname = "/packing";
  else if (role === "facturacion") url.pathname = "/packing/view";
  else url.pathname = "/admin";

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|api/auth).*)"],
};
