import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { header, lines } = body;

    if (!header || !lines) {
      return NextResponse.json({ error: "Missing header or lines" }, { status: 400 });
    }

    // Insertar packing
    const { data: packing, error: err1 } = await supabase
      .from("packings")
      .insert({
        invoice_no: header.invoice_no.toUpperCase(),
        client_code: header.client_code,
        client_name: header.client_name,
        address: header.address ?? ""
      })
      .select()
      .single();

    if (err1) return NextResponse.json({ error: err1.message }, { status: 500 });

    const packing_id = packing.id;

    // Insertar líneas
    const payload = lines.map((l: any) => ({
      packing_id,
      box_no: l.box_no,
      code: l.code,
      description_en: l.description_en,
      size: l.size,
      form: l.form,
      pounds: l.pounds
    }));

    const { error: err2 } = await supabase
      .from("packing_lines")
      .insert(payload);

    if (err2) return NextResponse.json({ error: err2.message }, { status: 500 });

    return NextResponse.json({ ok: true, packing_id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
