// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { readJson } from "@/lib/json-db";

const norm = (v: unknown) => String(v ?? "").trim();

export async function POST(req: Request) {
  let email = "";
  let password = "";

  const ct = req.headers.get("content-type") || "";

  // Acepta JSON o form-data
  try {
    if (ct.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      email = norm((body as any).email).toLowerCase();
      password = norm((body as any).password);
    } else {
      const fd = await req.formData().catch(() => null);
      email = norm(fd?.get("email")).toLowerCase();
      password = norm(fd?.get("password"));
    }
  } catch {}

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Missing credentials" },
      { status: 400 }
    );
  }

  const users = await readJson<any[]>("users.json", []);
  const user = users.find(
    (u) =>
      String(u.email).toLowerCase() === email &&
      String(u.password) === password
  );

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Invalid credentials" },
      { status: 401 }
    );
  }

  const payload = JSON.stringify({
    email: user.email,
    role: user.role,
    name: user.name ?? "",
    t: Date.now(),
  });

  const cookieValue = Buffer.from(payload).toString("base64");

  // Detectar dominio correctamente para Vercel o localhost
  const domain =
    process.env.NODE_ENV === "production"
      ? ".vercel.app"
      : "localhost";

  const res = NextResponse.json({
    ok: true,
    user: { email: user.email, role: user.role, name: user.name ?? "" },
  });

  // Guarda cookie correcta, compatible en Local y Vercel
  res.cookies.set("qp_session", cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    domain, // 💥 ESTE ES EL FIX CRÍTICO 💥
    maxAge: 60 * 60 * 24,
  });

  return res;
}
