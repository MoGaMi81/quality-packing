import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type LineDB = {
  box_no: string;
  code: string;
  description_en: string;
  scientific_name: string | null;
  form: string;
  size: string;
  pounds: number;
  price: number | null;
};

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

export async function GET(
  _req: Request,
  { params }: { params: { invoice: string } }
) {
  const invoice_no = params.invoice.toUpperCase();

  // 1️⃣ Obtener PACKING
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

  // 2️⃣ Obtener líneas
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

  const typedLines = lines as LineDB[];

  // =============================
  // CÁLCULO CORRECTO DE CAJAS
  // =============================
  const normalBoxes = new Set<string>();
  let hasMixed = false;

  for (const l of typedLines) {
    if (l.box_no === "MX") {
      hasMixed = true;
    } else {
      normalBoxes.add(l.box_no);
    }
  }

  const total_boxes = normalBoxes.size + (hasMixed ? 1 : 0);

  // =============================
  // RESUMEN COMERCIAL CORRECTO
  // =============================
  const rows: Row[] = [];
  const normalMap = new Map<string, Row>();

  for (const l of typedLines) {
    const price = l.price ?? 0;

    // 👉 MIXED: UNA FILA POR CADA CAJA MX
    if (l.box_no === "MX") {
      rows.push({
        boxes: "MX",
        pounds: l.pounds,
        description: l.description_en,
        size: l.size,
        form: l.form,
        scientific_name: l.scientific_name,
        price,
        amount: l.pounds * price,
      });
      continue;
    }

    // 👉 NORMALES: AGRUPAR
    const key = `${l.code}|${l.form}|${l.size}`;

    if (!normalMap.has(key)) {
      normalMap.set(key, {
        boxes: 1,
        pounds: l.pounds,
        description: l.description_en,
        size: l.size,
        form: l.form,
        scientific_name: l.scientific_name,
        price,
        amount: l.pounds * price,
      });
    } else {
      const row = normalMap.get(key)!;
      row.boxes = row.boxes as number + 1;
      row.pounds += l.pounds;
      row.amount = row.pounds * row.price;
    }
  }

  // Primero normales, luego MX (orden comercial)
  const finalRows = [...normalMap.values(), ...rows];

  // 4️⃣ Respuesta final
  return NextResponse.json({
    ok: true,
    invoice: {
      invoice_no: packing.invoice_no,
      client_code: packing.client_code,
      client_name: packing.client_code, // 🔜 luego catálogo
      guide: packing.guide,
      date: packing.created_at,
      total_boxes, // 🔒 FUENTE ÚNICA
      lines: finalRows,
    },
  });
}
