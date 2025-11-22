// src/app/api/auth/whoami/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const cookie = (req as any).headers.get("cookie") || "";
  const role = cookie.match(/role=([^;]+)/)?.[1] ?? null;
  return NextResponse.json({ role });
}
