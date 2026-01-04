import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { packing_id, header, lines } = body as {
      packing_id?: string | null;
      header: {
        invoice_no: string;
        client_code: string;
        date: string;
        guide: string;
      };
      lines: any[];
    };

    if (!header?.invoice_no) {
      return NextResponse.json(
        { ok: false, error: "Missing invoice_no" },
        { status: 400 }
      );
    }

    const invoiceNo = header.invoice_no.trim().toUpperCase();
    let packingId: string | null = packing_id ?? null;

    /* =====================
       1️⃣ Buscar packing por invoice_no
    ===================== */
    if (!packingId) {
      const { data: existing, error } = await supabase
        .from("packings")
        .select("id")
        .eq("invoice_no", invoiceNo)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (existing?.id) {
        packingId = existing.id;
      }
    }

    /* =====================
       2️⃣ Insert o Update header
    ===================== */
    if (!packingId) {
      const { data, error } = await supabase
        .from("packings")
        .insert({
          invoice_no: invoiceNo,
          client_code: header.client_code || null,
          date: header.date,
          guide: header.guide || null,
          status: "DRAFT",
        })
        .select("id")
        .single();

      if (error) throw error;
      packingId = data.id;
    } else {
      const { error } = await supabase
        .from("packings")
        .update({
          client_code: header.client_code || null,
          date: header.date,
          guide: header.guide || null,
          status: "DRAFT",
        })
        .eq("id", packingId);

      if (error) throw error;
    }

    /* =====================
       3️⃣ Reemplazar líneas
    ===================== */
    await supabase
      .from("packing_lines")
      .delete()
      .eq("packing_id", packingId);

    if (lines.length > 0) {
      const rows = lines.map((l) => ({
        packing_id: packingId,
        box_no: l.box_no,
        code: l.code,
        description_en: l.description_en,
        form: l.form,
        size: l.size,
        pounds: l.pounds,
        scientific_name: l.scientific_name,
      }));

      const { error } = await supabase
        .from("packing_lines")
        .insert(rows);

      if (error) throw error;
    }

    return NextResponse.json({
      ok: true,
      packing_id: packingId,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
