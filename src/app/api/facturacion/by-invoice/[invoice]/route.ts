import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type LineDB = {
  box_no: string;
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
  const { data: packing } = await supabase
    .from("packings")
    .select(`
      id,
      invoice_no,
      client_code,
      guide,
      created_at,
      total_boxes
    `)
    .eq("invoice_no", invoice_no)
    .single();

  if (!packing) {
    return NextResponse.json(
      { ok: false, error: "Factura no encontrada" },
      { status: 404 }
    );
  }

  // 2️⃣ LÍNEAS
  const { data: lines } = await supabase
    .from("packing_lines")
    .select(`
      box_no,
      description_en,
      scientific_name,
      form,
      size,
      pounds,
      price
    `)
    .eq("packing_id", packing.id);

  if (!lines || lines.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Factura sin líneas" },
      { status: 400 }
    );
  }

  const rows: Row[] = [];

  for (const l of lines as LineDB[]) {
    const isMixed = l.box_no === "MX";
    const price = l.price ?? 0;

    rows.push({
      boxes: isMixed ? "MX" : 1,
      pounds: l.pounds,
      description: l.description_en,
      size: l.size,
      form: l.form,
      scientific_name: l.scientific_name,
      price,
      amount: l.pounds * price,
    });
  }

  return NextResponse.json({
    ok: true,
    invoice: {
      invoice_no: packing.invoice_no,
      client_code: packing.client_code,
      client_name: packing.client_code, // luego catálogo
      guide: packing.guide,
      date: packing.created_at,
      total_boxes: packing.total_boxes, // 🔒 FUENTE ÚNICA
      lines: rows,
    },
  });
}
