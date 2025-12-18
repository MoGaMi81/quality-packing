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
      return NextResponse.json({ ok: false, error: "Missing data" }, { status: 400 });
    }

    // 1) Insert packing header
    const { data: packing, error: err1 } = await supabase
      .from("packings")
      .insert({
        invoice_no: header.invoice_no,
        client_code: header.client_code,
        client_name: header.client_name,
        address: header.address
      })
      .select("id")
      .single();

    if (err1 || !packing) {
      return NextResponse.json({ ok: false, error: err1?.message || "Insert header failed" });
    }

    const packing_id = packing.id;

    // 2) Insert lines
    const payload = lines.map((ln: any) => ({
      packing_id,
      box_no: ln.box_no,
      code: ln.code,
      description_en: ln.description_en,
      form: ln.form,
      size: ln.size,
      pounds: ln.pounds,
      scientific_name: ln.scientific_name,
    }));

    const { error: err2 } = await supabase
      .from("packing_lines")
      .insert(payload);

    if (err2) {
      return NextResponse.json({ ok: false, error: err2.message });
    }

    return NextResponse.json({ ok: true });

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "Server error" });
  }
}
