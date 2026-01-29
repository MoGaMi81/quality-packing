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

  // 1️⃣ PACKING
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

  // 2️⃣ LÍNEAS
  const { data, error: linesError } = await supabase
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

  if (!data || data.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Factura sin líneas" },
      { status: 400 }
    );
  }

  const lines = data as LineDB[];

  // =============================
  // 3️⃣ CONTAR OCURRENCIAS
  // =============================
  const counter = new Map<string, number>();

  for (const l of lines) {
    const key = `${l.code}|${l.form}|${l.size}`;
    counter.set(key, (counter.get(key) ?? 0) + 1);
  }

  // =============================
  // 4️⃣ CONSTRUIR FILAS
  // =============================
  const rows: Row[] = [];
  const normalMap = new Map<string, Row>();

  for (const l of lines) {
    const key = `${l.code}|${l.form}|${l.size}`;
    const times = counter.get(key)!;
    const price = l.price ?? 0;

    // 👉 MIXTA (solo aparece 1 vez)
    if (times === 1) {
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

    // 👉 NORMAL (agrupar)
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
      row.boxes = (row.boxes as number) + 1;
      row.pounds += l.pounds;
      row.amount = row.pounds * row.price;
    }
  }

  // =============================
  // 5️⃣ TOTAL CAJAS (CORRECTO)
  // =============================
  const total_boxes =
    Array.from(normalMap.values()).reduce(
      (s, r) => s + (r.boxes as number),
      0
    ) + rows.length;

  // =============================
  // 6️⃣ RESPUESTA FINAL
  // =============================
  return NextResponse.json({
    ok: true,
    invoice: {
      invoice_no: packing.invoice_no,
      client_code: packing.client_code,
      client_name: packing.client_code, // 🔜 se conecta a catálogo
      guide: packing.guide,
      date: packing.created_at,
      total_boxes,
      lines: [...normalMap.values(), ...rows],
    },
  });
}
