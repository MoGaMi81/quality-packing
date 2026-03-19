import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Credenciales inválidas" },
      { status: 400 }
    );
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .single();

  if (error || !user) {
    return NextResponse.json(
      { ok: false, error: "Usuario no encontrado" },
      { status: 401 }
    );
  }

  if (!user.active) {
    return NextResponse.json(
      { ok: false, error: "Usuario desactivado" },
      { status: 403 }
    );
  }

  // 🔑 Validación híbrida + migración automática
  let valid = false;

  if (user.password.startsWith("$2b$")) {
    // contraseña encriptada con bcrypt
    valid = await bcrypt.compare(password, user.password);
  } else {
    // contraseña antigua en texto plano
    valid = user.password === password;

    // si es válida, migrar automáticamente a bcrypt
    if (valid) {
      const hash = await bcrypt.hash(password, 10);
      await supabase
        .from("users")
        .update({ password: hash })
        .eq("id", user.id);
    }
  }

  if (!valid) {
    return NextResponse.json(
      { ok: false, error: "Contraseña incorrecta" },
      { status: 401 }
    );
  }

  // ✅ Nueva sesión real
  const session = {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    ts: Date.now(), // útil para debug / expiración futura
  };

  const res = NextResponse.json({
    ok: true,
    user: session,
  });

  // 🔐 cookie REAL de sesión
  res.cookies.set("qp_session", encodeURIComponent(JSON.stringify(session)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  // ❌ opcional: eliminar si ya no la usas
  res.cookies.set("role", user.role, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return res;
}