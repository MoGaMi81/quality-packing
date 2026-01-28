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

  /* =====================================================
     1️⃣ Obtener PACKING por invoice_no (SIN JOIN)
     ===================================================== */
  const { data: packing, error: packingError } = await supabase
    .from("packings")
    .select(`
      id,
      invoice_no,
      client_code,
      guide,
      created_at
    `)
    .eq("invoice_no", invoice_no)
    .single();

  if (packingError || !packing) {
    return NextResponse.json(
      { ok: false, error: "Factura no encontrada" },
      { status: 404 }
    );
  }

  /* =====================================================
     2️⃣ Obtener líneas del packing
     ===================================================== */
  const { data: lines, error: linesError } = await supabase
    .from("packing_lines")
    .select(`
      box_no,
      code,
      description_en,
      scientific_name,
      form,
      size,
      pounds,
      price
    `)
    .eq("packing_id", packing.id);

  if (linesError) {
    return NextResponse.json(
      { ok: false, error: linesError.message },
      { status: 500 }
    );
  }

  if (!lines || lines.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Factura sin líneas" },
      { status: 400 }
    );
  }

  /* =====================================================
     3️⃣ Construir RESUMEN FACTURA
        - MX → agrupar todas en una sola caja
        - normales → agrupar por especie / forma / talla
     ===================================================== */
  type Row = {
    boxes: number | "MX";
    pounds: number;
    description: string;
    size: string;
    form: string;
    scientific_name: string | null;
    price: number;
    amount: number;
  };

  const map = new Map<string, Row>();
  let mxRow: Row | null = null;

  for (const l of lines) {
    const isMixed = l.box_no === "MX";

    if (isMixed) {
      if (!mxRow) {
        mxRow = {
          boxes: "MX",
          pounds: l.pounds,
          description: l.description_en,
          size: l.size,
          form: l.form,
          scientific_name: l.scientific_name ?? null,
          price: l.price,
          amount: l.pounds * l.price,
        };
      } else {
        mxRow.pounds += l.pounds;
        mxRow.amount = mxRow.pounds * mxRow.price;
      }
      continue;
    }

    const key = `${l.code}|${l.form}|${l.size}`;

    if (!map.has(key)) {
      map.set(key, {
        boxes: 1,
        pounds: l.pounds,
        description: l.description_en,
        size: l.size,
        form: l.form,
        scientific_name: l.scientific_name ?? null,
        price: l.price,
        amount: l.pounds * l.price,
      });
    } else {
      const row = map.get(key)!;
      if (typeof row.boxes === "number") {
        row.boxes += 1;
      }
      row.pounds += l.pounds;
      row.amount = row.pounds * row.price;
    }
  }

  if (mxRow) {
    map.set("MX", mxRow);
  }

  /* =====================================================
     4️⃣ Respuesta final
     ===================================================== */
  return NextResponse.json({
    ok: true,
    invoice: {
      invoice_no: packing.invoice_no,
      client_code: packing.client_code,
      client_name: packing.client_code, // 👈 por ahora igual al código
      guide: packing.guide,
      date: packing.created_at,
      lines: Array.from(map.values()),
    },
  });
}