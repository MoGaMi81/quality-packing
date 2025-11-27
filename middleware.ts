import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC = ["/login", "/api/auth/login"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const raw = req.cookies.get("qp_session")?.value;
  if (!raw) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  try {
    const json = JSON.parse(decodeURIComponent(raw));
    const role = (json.role || "").toLowerCase();

    if (!["admin", "proceso", "facturacion"].includes(role)) {
      throw new Error("Rol inválido");
    }

    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};