import { NextResponse } from "next/server";
import { readJson } from "@/lib/json-db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const no = String(url.searchParams.get("no") || "").trim().toUpperCase();
  if (!no) return NextResponse.json({ ok: false, error: "Missing no" }, { status: 400 });

  const store = await readJson<any[]>("packings.json", []);
  const exists = store.some(p => String(p?.packing?.invoice_no).toUpperCase() === no);
  return NextResponse.json({ ok: true, exists });
}

