import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/json-db";

export async function POST(req: Request) {
  const body = await req.json();
  const { invoice_no, pricing } = body;

  if (!invoice_no || !pricing) {
    return NextResponse.json({ ok: false, error: "Datos incompletos." });
  }

  const store = await readJson<any[]>("packings.json", []);

  const idx = store.findIndex(
    (p) => String(p?.packing?.invoice_no ?? "").trim().toUpperCase() === invoice_no.trim().toUpperCase()
  );

  if (idx === -1) {
    return NextResponse.json({ ok: false, error: "Packing no encontrado." });
  }

  // Guardar pricing dentro del packing
  store[idx].pricing = pricing;

  await writeJson("packings.json", store);

  return NextResponse.json({ ok: true });
}
