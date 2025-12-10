import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { status, packing } = await req.json();
    const { invoice_no, header, lines } = packing;

    if (!invoice_no || !header || !lines?.length) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    // 1) Insert header
   // 0) Validar duplicados
const { data: existing, error: checkErr } = await supabase
  .from("packings")
  .select("id")
  .eq("invoice_no", invoice_no.toUpperCase())
  .single();

if (existing) {
  return NextResponse.json(
    { error: `La factura ${invoice_no.toUpperCase()} ya existe` },
    { status: 409 }
  );
}

// 1) Insertar header
const { data: p, error: err1 } = await supabase
  .from("packings")
  .insert({
    invoice_no: invoice_no.toUpperCase(),
    client_code: header.client_code,
    client_name: header.client_name,
    address: header.address,
    tax_id: header.tax_id,
    guide: header.guide,
    date: header.date,
    updated_at: new Date().toISOString(),
  })
  .select()
  .single();

if (err1) {
  console.error(err1);
  return NextResponse.json({ error: err1.message }, { status: 500 });
}

const packingId = p.id;

    // 2) Replace all lines
    await supabase.from("packing_lines").delete().eq("packing_id", packingId);

    const formatted = lines.map((l: any) => ({
      packing_id: packingId,
      box_no: l.box_no,
      description_en: l.description_en,
      form: l.form,
      size: l.size,
      pounds: l.pounds,
    }));

    const { error: err2 } = await supabase
      .from("packing_lines")
      .insert(formatted);

    if (err2) {
      console.error(err2);
      return NextResponse.json({ error: err2.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });

  } catch (e: any) {
    console.error("SAVE ERROR", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

