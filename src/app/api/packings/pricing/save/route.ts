// src/app/api/packings/pricing/save/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { invoice_no, lines } = body;

    if (!invoice_no || !lines) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 1) Buscar packing
    const { data: packing, error: err1 } = await supabase
      .from("packings")
      .select("*")
      .eq("invoice_no", invoice_no.toUpperCase())
      .single();

    if (err1 || !packing) {
      return NextResponse.json({ error: "Packing not found" }, { status: 404 });
    }

    // 2) Borrar pricing anterior
    const { error: errDelParent } = await supabase
      .from("packing_pricing")
      .delete()
      .eq("packing_id", packing.id);

    if (errDelParent)
      return NextResponse.json({ error: errDelParent.message }, { status: 500 });

    // 3) Crear cabecera pricing
    const { data: pricing, error: errHead } = await supabase
      .from("packing_pricing")
      .insert({
        packing_id: packing.id,
        invoice_no: invoice_no.toUpperCase()
      })
      .select()
      .single();

    if (errHead)
      return NextResponse.json({ error: errHead.message }, { status: 500 });

    const pricing_id = pricing.id;

    // 4) Insertar líneas pricing
    const payload = lines.map((l: any) => ({
      pricing_id,
      box_no: l.box_no,
      description_en: l.description_en,
      size: l.size,
      form: l.form,
      pounds: l.pounds,
      price: l.price,
      total: l.total,
      scientific_name: l.scientific_name
    }));

    const { error: errInsLines } = await supabase
      .from("packing_pricing_lines")
      .insert(payload);

    if (errInsLines)
      return NextResponse.json({ error: errInsLines.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
