import { NextResponse } from "next/server";

export function GET(req: Request) {
  const cookie = (req as any).headers.get("cookie") || "";
  const m = /qp_session=([^;]+)/.exec(cookie);
  if (!m) return NextResponse.json({ ok: false });
  try {
    const json = JSON.parse(Buffer.from(m[1], "base64").toString("utf8"));
    return NextResponse.json({ ok: true, user: json });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
