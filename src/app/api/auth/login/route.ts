import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    .eq("email", email)
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

  if (user.password !== password) {
    return NextResponse.json(
      { ok: false, error: "Contraseña incorrecta" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({
    ok: true,
    role: user.role,
    name: user.name,
  });

  res.cookies.set("role", user.role, {
    httpOnly: false,
    path: "/",
  });

  return res;
}