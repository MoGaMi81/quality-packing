// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";

// Simulación base de usuarios.
const USERS: Record<string, { role: string; name: string }> = {
  "admin@quality.test": { role: "admin", name: "Admin" },
  "proceso@quality.test": { role: "proceso", name: "Proceso" },
  "facturacion@quality.test": { role: "facturacion", name: "Facturación" },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || "").toLowerCase();
    const password = body.password ?? "";


    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos." },
        { status: 400 }
      );
    }
    

    const user = USERS[email.toLowerCase()];
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Usuario no encontrado." },
        { status: 401 }
      );
    }

    // Construir sesión
    const session = {
      email,
      role: user.role,
      name: user.name,
      t: Date.now(),
    };

    const res = NextResponse.json({
  ok: true,
  user: session,
});

// IMPORTANTE: esperar a que el navegador guarde cookie
res.cookies.set("qp_session", encodeURIComponent(JSON.stringify(session)), {
  path: "/",
  httpOnly: false,
  secure: false,
  sameSite: "lax",
  maxAge: 60 * 60 * 24,
});

    return res;

  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return NextResponse.json(
      { ok: false, error: "Error interno." },
      { status: 500 }
    );
  }
}
