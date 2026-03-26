import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // 🔥 eliminar qp_session correctamente
  res.cookies.set("qp_session", "", {
    path: "/",
    maxAge: 0,
  });

  return res;
}
