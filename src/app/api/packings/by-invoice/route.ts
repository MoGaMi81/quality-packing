// src/app/api/packing/by-invoice/route.ts
import { NextResponse } from "next/server";
import { readJson } from "@/lib/json-db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const inv = (searchParams.get("inv") || "").trim();
  if (!inv) {
    return NextResponse.json({ ok: false, error: "Missing inv param" }, { status: 400 });
  }

  // Lee archivo principal
  const all = await readJson<any[]>("packings.json", []);

  // Busca por invoice_no (case-sensitive por seguridad)
  const found = all.find((p) => p?.invoice_no === inv);

  if (!found) {
    return NextResponse.json({ ok: false, error: "Invoice not found" }, { status: 404 });
  }

  // Por seguridad, nunca devolvemos precios aquí
  return NextResponse.json({ ok: true, packing: found });
}

