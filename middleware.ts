// src/middleware.ts
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

  let role = "";
  try {
    const json = JSON.parse(decodeURIComponent(raw));
    role = (json.role || "").toLowerCase();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Meter rol en headers (visible solo en server → seguro)
  const res = NextResponse.next();
  res.headers.set("x-user-role", role);
  res.headers.set("x-middleware-set-cookie", `x-role=${role}`);
  return res;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
