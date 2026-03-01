// src/app/api/packing/check-invoice/[invoice]/route.ts
import { NextResponse } from "next/server";
import { readJson } from "@/lib/json-db";

export async function GET(
  _req: Request,
  { params }: { params: { invoice: string } }
) {
  const list = await readJson<any[]>("packings.json", []);
  const exists = list.some(
    (p) => (p.header?.invoice_no ?? p.invoice_no) === params.invoice
  );
  return NextResponse.json({ ok: true, exists });
}


