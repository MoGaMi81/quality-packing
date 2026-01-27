import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: Request,
  { params }: { params: { invoice: string } }
) {
  const invoice_no = params.invoice.toUpperCase();

  /* =============================
     1️⃣ Obtener DRAFT por factura
     ============================= */
  const { data: draft, error: draftError } = await supabase
    .from("packing_drafts")
    .select("id, client_code, guide, created_at, invoice_no")
    .eq("invoice_no", invoice_no)
    .single();

  if (draftError || !draft) {
    return NextResponse.json(
      { ok: false, error: "Factura no encontrada" },
      { status: 404 }
    );
  }

  /* =============================
     2️⃣ Obtener líneas reales
     ============================= */
  const { data: lines, error: linesError } = await supabase
    .from("packing_lines")
    .select(`
      code,
      description_en,
      scientific_name,
      form,
      size,
      pounds,
      price,
      is_mixed
    `)
    .eq("packing_id", draft.id);

  if (linesError || !lines || lines.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Factura sin líneas" },
      { status: 400 }
    );
  }

  /* =============================
     3️⃣ Construir resumen factura
     ============================= */
  const map = new Map<string, any>();
  let mixIndex = 0;

  for (const l of lines) {
    const key = l.is_mixed
      ? `MX|${mixIndex++}`
      : `${l.code}|${l.form}|${l.size}`;

    if (!map.has(key)) {
      map.set(key, {
        boxes: l.is_mixed ? "MX" : 1,
        pounds: l.pounds,
        description: l.description_en,
        size: l.size,
        form: l.form,
        scientific_name: l.scientific_name,
        price: l.price,
        amount: l.pounds * l.price,
      });
    } else {
      const row = map.get(key);
      if (!l.is_mixed) row.boxes += 1;
      row.pounds += l.pounds;
      row.amount = row.pounds * row.price;
    }
  }

  return NextResponse.json({
    ok: true,
    invoice: {
      invoice_no: draft.invoice_no,
      client_code: draft.client_code,
      guide: draft.guide,
      date: draft.created_at,
      lines: Array.from(map.values()),
    },
  });
}
