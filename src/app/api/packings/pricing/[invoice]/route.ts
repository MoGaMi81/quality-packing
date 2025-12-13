import { NextResponse } from "next/server";
import { readJson } from "@/lib/json-db";

export async function GET(
  req: Request,
  ctx: { params: { invoice: string } }
) {
  const invoice = ctx.params.invoice.toUpperCase();
  const store = await readJson<any[]>("packings.json", []);

  const found = store.find(
    (p) =>
      String(p?.packing?.invoice_no ?? "")
        .trim()
        .toUpperCase() === invoice
  );

  if (!found) return NextResponse.json({ ok: false, pricing: null });

  return NextResponse.json({
    ok: true,
    pricing: found.pricing ?? null,
    packing: found.packing ?? null,
  });
}
