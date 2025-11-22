import { NextResponse } from "next/server";
import { readJson } from "@/lib/json-db";

export async function GET() {
  try {
    const users = await readJson<any[]>("users.json", []);
    return NextResponse.json({
      ok: true,
      count: users.length,
      sample: users.slice(0, 3).map(u => ({ email: u.email, role: u.role }))
    });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
