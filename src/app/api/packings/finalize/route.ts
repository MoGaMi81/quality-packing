import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      packing_id,
      header,
      lines,
    } = body as {
      packing_id: string;
      header: {
        invoice_no: string;
        client_code: string;
        date: string;
        guide: string;
      };
      lines: any[];
    };

    if (!packing_id) {
      return NextResponse.json(
        { ok: false, error: "Missing packing_id" },
        { status: 400 }
      );
    }

    /* =====================
       1️⃣ Verificar packing
    ===================== */
    const { data: existing, error: e1 } = await supabase
      .from("packings")
      .select("id,status")
      .eq("id", packing_id)
      .single();

    if (e1 || !existing) {
      return NextResponse.json(
        { ok: false, error: "Packing not found" },
        { status: 404 }
      );
    }

    if (existing.status === "final") {
      return NextResponse.json(
        { ok: false, error: "Packing already finalized" },
        { status: 409 }
      );
    }

    /* =====================
       2️⃣ Update header + status
    ===================== */
    const { error: e2 } = await supabase
      .from("packings")
      .update({
        client_code: header.client_code,
        date: header.date,
        guide: header.guide,
        status: "final",
        finalized_at: new Date().toISOString(),
      })
      .eq("id", packing_id);

    if (e2) throw e2;

    /* =====================
       3️⃣ Replace lines
    ===================== */
    const { error: eDel } = await supabase
      .from("packing_lines")
      .delete()
      .eq("packing_id", packing_id);

    if (eDel) throw eDel;

    if (lines.length > 0) {
      const rows = lines.map((l) => ({
        packing_id,
        box_no: l.box_no,
        code: l.code,
        description_en: l.description_en,
        form: l.form,
        size: l.size,
        pounds: l.pounds,
        scientific_name: l.scientific_name,
      }));

      const { error: e3 } = await supabase
        .from("packing_lines")
        .insert(rows);

      if (e3) throw e3;
    }

    /* =====================
       4️⃣ Done
    ===================== */
    return NextResponse.json({ ok: true });

  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
