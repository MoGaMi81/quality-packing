import { NextResponse } from "next/server";
import { readJson } from "@/lib/json-db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const invoice = (searchParams.get("invoice") || "")?.trim()?.toUpperCase();
  if (!invoice) return NextResponse.json({ ok:false, error:"missing invoice" }, { status:400 });

  const packings = await readJson<any[]>("packings.json", []);
  const exists = packings.some(x => (x?.header?.invoice || "").toUpperCase() === invoice);
  return NextResponse.json({ ok:true, exists });
}
