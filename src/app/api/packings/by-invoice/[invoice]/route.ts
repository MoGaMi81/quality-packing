import { NextResponse } from "next/server";
import { readJson } from "@/lib/json-db";

export async function GET(
  _req: Request,
  ctx: { params: { invoice: string } }
) {
  const invoice = decodeURIComponent(ctx.params.invoice).toUpperCase();
  const store = await readJson<any[]>("packings.json", []);

  const found = store.find(
    (p) =>
      String(p?.packing?.invoice_no ?? "")
        .trim()
        .toUpperCase() === invoice
  );

  if (!found) {
    // devolvemos 200 con packing null para que fetchJSON no truene
    return NextResponse.json({ packing: null });
  }

  return NextResponse.json({
    status: found.status,
    packing: found.packing,
  });
}
