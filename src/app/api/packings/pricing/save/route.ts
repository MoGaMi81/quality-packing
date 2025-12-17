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

    const invoice = invoice_no.toUpperCase();

    const { data: packing } = await supabase
      .from("packings")
      .select("id")
      .eq("invoice_no", invoice)
      .single();

    if (!packing)
      return NextResponse.json({ error: "Packing not found" }, { status: 404 });

    const packing_id = packing.id;

    // delete old pricing
    await supabase
      .from("packing_pricing_lines")
      .delete()
      .eq("packing_id", packing_id);

    const payload = lines.map((l: any) => ({
      packing_id,
      box_no: l.box_no,
      pounds: l.pounds,
      price: l.price,
      total: l.total,
      description_en: l.description_en,
      size: l.size,
      form: l.form,
      scientific_name: l.scientific_name,
    }));

    const { error } = await supabase
      .from("packing_pricing_lines")
      .insert(payload);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
