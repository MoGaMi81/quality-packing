// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";

// Simulación base de usuarios.
const USERS = {
  "admin@quality.test":       { role: "admin",        name: "admin" },
  "proceso@quality.test":     { role: "proceso",      name: "proceso" },
  "facturacion@quality.test": { role: "facturacion",  name: "facturación" },
};

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

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
