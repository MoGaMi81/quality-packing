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

    // ----------------------------------------------------
    // 1) Buscar packing_id por invoice_no
    // ----------------------------------------------------
    const { data: packing, error: err1 } = await supabase
      .from("packings")
      .select("id")
      .eq("invoice_no", invoice_no.toUpperCase())
      .single();

    if (err1 || !packing) {
      return NextResponse.json({ error: "Packing not found" }, { status: 404 });
    }

    const packing_id = packing.id;

    // ----------------------------------------------------
    // 2) Eliminar pricing previo
    // ----------------------------------------------------
    await supabase
      .from("packing_pricing_lines")
      .delete()
      .eq("packing_id", packing_id);

    // ----------------------------------------------------
    // 3) Insertar el nuevo pricing
    // ----------------------------------------------------
    const payload = lines.map((l: any) => ({
      packing_id,
      // siempre la caja REAL (MX jamás se guarda)
      box_no: l.combined_with ?? l.box_no,

      description_en: l.description_en,
      size: l.size,
      form: l.form,

      pounds: l.pounds,
      price: l.price,
      total: l.total,

      // IMPORTANTE: scientific_name NO SE GUARDA EN ESTE MODELO
    }));

    const { error: err2 } = await supabase
      .from("packing_pricing_lines")
      .insert(payload);

    if (err2) {
      console.error(err2);
      return NextResponse.json({ error: err2.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });

  } catch (e: any) {
    console.error("SAVE ERROR", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
