import { NextResponse } from "next/server";
import { readJson } from "@/lib/json-db";

const up = (s?: string) => (s ?? "")?.trim().toUpperCase();

export async function GET(_req: Request, { params }: { params: { code: string } }) {
  const code = up(params.code);
  const clients = await readJson<any[]>("clients.json", []);
  const c = clients.find(x => up(x.code) === code);
  if (!c) return NextResponse.json({ ok:false, error:`Cliente ${code} no existe` });
  return NextResponse.json({ ok:true, client:c });
}
