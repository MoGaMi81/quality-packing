import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC = ["/login", "/api/auth/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas permitidas sin login
  if (PUBLIC.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Cookie real
  const raw = req.cookies.get("qp_session")?.value;

  if (!raw) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Validar JSON
  let role = "";
  try {
    const json = JSON.parse(decodeURIComponent(raw));
    role = (json.role || "").toLowerCase();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Permitir continuar
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
