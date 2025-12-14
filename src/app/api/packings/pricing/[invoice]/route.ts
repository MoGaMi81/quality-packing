import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  ctx: { params: { invoice: string } }
) {
  try {
    let invoice = ctx.params.invoice.trim().toUpperCase();

    // 1) Buscar packing por invoice
    const { data: packingRow, error: err1 } = await supabase
      .from("packings")
      .select("id, invoice_no, client_code, client_name, address, tax_id, guide, date")
      .eq("invoice_no", invoice)
      .single();

    if (err1 || !packingRow) {
      console.log("NO SE ENCONTRÓ PACKING:", invoice);
      return NextResponse.json({ ok: false, packing: null, pricing: null });
    }

    // 2) Traer líneas del packing
    const { data: lines, error: err2 } = await supabase
      .from("packing_lines")
      .select("*")
      .eq("packing_id", packingRow.id)
      .order("box_no", { ascending: true });

    if (err2) throw err2;

    // 3) Traer pricing (si ya existe)
    const { data: pricingRow, error: err3 } = await supabase
      .from("pricing")
      .select("data")
      .eq("packing_id", packingRow.id)
      .single();

    return NextResponse.json({
      ok: true,
      packing: {
        header: {
          client_code: packingRow.client_code,
          client_name: packingRow.client_name,
          address: packingRow.address,
          tax_id: packingRow.tax_id,
          guide: packingRow.guide,
          invoice_no: packingRow.invoice_no,
          date: packingRow.date,
        },
        lines,
      },
      pricing: pricingRow?.data ?? null,
    });

  } catch (e) {
    console.error("PRICING GET ERROR:", e);
    return NextResponse.json({ ok: false, error: "Server error" });
  }
}
