import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type LineDB = {
  id: string;
  box_no: string;
  code: string;
  description_en: string;
  scientific_name: string | null;
  form: string;
  size: string;
  pounds: number;
  price: number | null;
  is_combined: boolean;
  combined_with: string | null;
};

type Row = {
  line_id: string;
  box_no: number;
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
  { params }: { params: { id: string } }
) {
  const invoice_no = params.id.toUpperCase();

  /* =====================================================
     1️⃣ PACKING + CLIENTE
     ===================================================== */
  const { data: packing, error: packingError } = await supabase
    .from("packings")
    .select(`
      id,
      invoice_no,
      client_code,
      guide,
      created_at,
      clients (
        name
      )
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
     1️⃣ BIS - TRAER CLIENTE DESDE clients
     ===================================================== */
  const { data: clientData } = await supabase
    .from("clients")
    .select("name")
    .eq("code", packing.client_code)
    .single();

  const clientName = clientData?.name ?? packing.client_code;

  /* =====================================================
     2️⃣ LÍNEAS
     ===================================================== */
  const { data, error: linesError } = await supabase
    .from("packing_lines")
    .select(`
      id,
      box_no,
      code,
      description_en,
      scientific_name,
      form,
      size,
      pounds,
      price,
      is_combined,
      combined_with
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

  /* =====================================================
     2️⃣ BIS - TRAER SCIENTIFIC NAME DESDE SPECIES
     ===================================================== */
  const codes = [...new Set(lines.map(l => l.code))];

  const { data: speciesData } = await supabase
    .from("species")
    .select("code, scientific_name")
    .in("code", codes);

  const speciesMap = new Map<string, string | null>();

  if (speciesData) {
    for (const s of speciesData) {
      speciesMap.set(s.code, s.scientific_name);
    }
  }

  /* =====================================================
     3️⃣ CONSTRUIR FILAS
     ===================================================== */
  const rows: Row[] = [];
  const normalMap = new Map<string, Row>();

  const normalBoxes = new Set<string>();
  const combinedBoxes = new Set<string>();

  for (const l of lines) {
    const price = l.price ?? 0;

    //  CAJA COMBINADA
    if (l.is_combined) {
      combinedBoxes.add(String(l.box_no));

      rows.push({
        line_id: l.id,
        box_no: Number(l.box_no),
        boxes: 1,
        pounds: l.pounds,
        description: l.description_en,
        size: l.size,
        form: l.form,
        scientific_name: speciesMap.get(l.code) ?? null,
        price,
        amount: l.pounds * price,
      });

      continue;
    }

    // CAJA NORMAL
    normalBoxes.add(String(l.box_no));

    const key = `${l.description_en}|||${l.form}|||${l.size}`;

    if (!normalMap.has(key)) {
        normalMap.set(key, {
        line_id: l.id,
        box_no: Number(l.box_no),
        boxes: 1,
        pounds: l.pounds,
        description: l.description_en,
        size: l.size,
        form: l.form,
        scientific_name: speciesMap.get(l.code) ?? null,
        price,
        amount: l.pounds * price,
      });
    } else {
      const row = normalMap.get(key)!;
      row.boxes = (row.boxes as number) + 1;
      row.pounds += l.pounds;

      row.price = price;
      row.amount = row.pounds * row.price;
    }
  }

  /* =====================================================
     4️⃣ TOTAL DE CAJAS
     ===================================================== */
  const total_boxes = normalBoxes.size + combinedBoxes.size;

  /* =====================================================
     5️⃣ RESPUESTA FINAL
     ===================================================== */
  return NextResponse.json({
    ok: true,
    invoice: {
      packing_id: packing.id,
      invoice_no: packing.invoice_no,
      client_code: packing.client_code,
      client_name: clientName,
      guide: packing.guide,
      date: packing.created_at,
      total_boxes,
      lines: [...normalMap.values(), ...rows],
      raw_lines: lines,
    },
  });
}