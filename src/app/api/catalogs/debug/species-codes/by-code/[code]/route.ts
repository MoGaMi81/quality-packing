import { NextResponse } from "next/server";
import { readJson } from "@/lib/json-db";

const up = (s?: string) => (s ?? "").trim().toUpperCase();

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const code = up(params.code);
  const sc = await readJson<any[]>("species_codes.json", []);
  const found = sc.find(x => up(x.code) === code);
  if (!found) return NextResponse.json({ ok:false, reason:"not-in-species_codes.json" }, { status: 404 });
  return NextResponse.json({ ok:true, entry: found });
}
