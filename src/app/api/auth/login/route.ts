// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { readJson } from "@/lib/json-db";

const norm = (v: unknown) => String(v ?? "").trim();

export async function POST(req: Request) {
  let email = "";
  let password = "";

  const ct = req.headers.get("content-type") || "";

  // Acepta JSON y también form-data / x-www-form-urlencoded
  try {
    if (ct.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      email = norm((body as any).email || (body as any).username).toLowerCase();
      password = norm((body as any).password);
    } else {
      const fd = await req.formData().catch(() => null);
      email = norm(fd?.get("email") || fd?.get("username")).toLowerCase();
      password = norm(fd?.get("password"));
    }
  } catch {}

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Missing email/password" }, { status: 400 });
  }

  const users = await readJson<any[]>("users.json", []);
  const user = users.find(
    (u) => String(u.email).toLowerCase() === email && String(u.password) === password
  );

  if (!user) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }

  // sesión simple (dev)
  const res = NextResponse.json({
    ok: true,
    user: { email: user.email, role: user.role, name: user.name ?? "" },
  });

  const payload = JSON.stringify({
    email: user.email,
    role: user.role,
    name: user.name ?? "",
    t: Date.now(),
  });

  res.cookies.set("qp_session", Buffer.from(payload).toString("base64"), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return res;
}
