import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas públicas sin sesión
const PUBLIC = ["/login", "/api/auth/login"];

// Patrones de rutas sospechosas generadas por errores del sistema
const SUSPICIOUS_PATTERNS = [
  "/api/drafts/get/list",
  "/api/drafts/get/undefined",
  "/api/drafts/get/null",
  "/undefined",
  "/api/undefined",
];

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 1) --- DETECCIÓN DE RUTAS INCORRECTAS ---
  const suspicious = SUSPICIOUS_PATTERNS.some((p) =>
    pathname.startsWith(p)
  );

  if (suspicious) {
    const clientIp = req.headers.get("x-forwarded-for") || "IP desconocida";
    const userAgent = req.headers.get("user-agent") || "User-Agent desconocido";
    const referer = req.headers.get("referer") || "Referer no disponible";

    console.warn("[DEFENSIVE MIDDLEWARE] Ruta sospechosa detectada:");
    console.warn("→ Path:", pathname);
    console.warn("→ IP:", clientIp);
    console.warn("→ User-Agent:", userAgent);
    console.warn("→ Referer:", referer);
    console.warn("→ Método:", req.method);
    console.warn("→ Query Params:", Object.fromEntries(searchParams.entries()));

    return NextResponse.json(
      {
        ok: false,
        error: "Ruta incorrecta o no implementada.",
        path: pathname,
        trace: {
          ip: clientIp,
          userAgent,
          referer,
          method: req.method,
          query: Object.fromEntries(searchParams.entries()),
        },
      },
      { status: 404 }
    );
  }

  // 2) --- PERMITIR RUTAS PÚBLICAS ---
  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 3) --- VALIDAR SESIÓN ---
  const raw = req.cookies.get("qp_session")?.value;
  if (!raw) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // 4) --- VALIDAR ROL ---
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