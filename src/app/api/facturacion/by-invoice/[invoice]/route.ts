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

  // =============================
  // CÁLCULO CORRECTO DE CAJAS
  // =============================
  const normalBoxes = new Set<string>();
  let hasMixed = false;

  for (const l of lines) {
    const box = String(l.box_no);
    if (box === "MX") {
      hasMixed = true;
    } else {
      normalBoxes.add(box);
    }
  }

  const total_boxes = normalBoxes.size + (hasMixed ? 1 : 0);

  // =============================
  // RESUMEN COMERCIAL (CORRECTO)
  // =============================
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

  const normalMap = new Map<string, Row>();
  const rows: Row[] = [];

  for (const l of lines) {
    const box = String(l.box_no);
    const price = l.price ?? 0;

    // =====================
    // MX → UNA FILA POR LÍNEA
    // =====================
    if (box === "MX") {
      rows.push({
        boxes: "MX",
        pounds: l.pounds,
        description: l.description_en,
        size: l.size,
        form: l.form,
        scientific_name: l.scientific_name ?? null,
        price,
        amount: l.pounds * price,
      });
      continue;
    }

    // =====================
    // NORMALES → AGRUPADAS
    // =====================
    const key = `${l.code}|${l.form}|${l.size}`;

    if (!normalMap.has(key)) {
      normalMap.set(key, {
        boxes: 1,
        pounds: l.pounds,
        description: l.description_en,
        size: l.size,
        form: l.form,
        scientific_name: l.scientific_name ?? null,
        price,
        amount: l.pounds * price,
      });
    } else {
      const row = normalMap.get(key)!;
      row.boxes = (row.boxes as number) + 1;
      row.pounds += l.pounds;
      row.amount = row.pounds * row.price;
    }
  }

  // Primero normales, luego MX (orden lógico)
  const finalLines = [...normalMap.values(), ...rows];

  // 4️⃣ Respuesta final
  return NextResponse.json({
    ok: true,
    invoice: {
      invoice_no: packing.invoice_no,
      client_code: packing.client_code,
      client_name: packing.client_code, // luego se conecta al catálogo
      guide: packing.guide,
      date: packing.created_at,
      total_boxes, // 🔒 FUENTE ÚNICA
      lines: finalLines,
    },
  });
}
