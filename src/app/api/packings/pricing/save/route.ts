import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const invoice_no = (body.invoice_no || "").trim().toUpperCase();
    const pricing = body.pricing || [];

    if (!invoice_no || !Array.isArray(pricing) || pricing.length === 0) {
      return NextResponse.json(
        { error: "Missing invoice_no or pricing lines" },
        { status: 400 }
      );
    }

    // Totales
    const total_lbs = pricing.reduce((s: number, l: any) => s + (l.pounds || 0), 0);
    const grand_total = pricing.reduce((s: number, l: any) => s + (l.total || 0), 0);

    // 1) Borrar líneas anteriores
    await supabase
      .from("packing_pricing_lines")
      .delete()
      .eq("invoice_no", invoice_no);

    // 2) Insertar nuevas líneas
    const rows = pricing.map((l: any) => ({
      invoice_no,
      box_no: typeof l.box_no === "number" ? String(l.box_no) : "MX",
      code: l.code || null,
      description_en: l.description_en,
      form: l.form,
      size: l.size,
      pounds: l.pounds,
      price: l.price,
      total: l.total,
    }));

    const { error: errLines } = await supabase
      .from("packing_pricing_lines")
      .insert(rows);

    if (errLines) {
      console.error(errLines);
      return NextResponse.json({ error: errLines.message }, { status: 500 });
    }

    // 3) Guardar resumen en packings_pricing
    const { error: errHead } = await supabase
      .from("packings_pricing")
      .upsert({
        invoice_no,
        total_lbs,
        grand_total,
        updated_at: new Date().toISOString(),
      });

    if (errHead) {
      console.error(errHead);
      return NextResponse.json({ error: errHead.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("SAVE PRICING ERROR", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

