// src/app/api/packings/pricing/[invoice]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: { invoice: string } }
) {
  const invoice = params.invoice.toUpperCase();

  // ---------------------------------------------------------
  // 1) Obtener PACKING (header) por invoice_no
  // ---------------------------------------------------------
  const { data: packing, error: err1 } = await supabase
    .from("packings")
    .select("id, invoice_no, client_code, client_name, address, tax_id, guide, date")
    .eq("invoice_no", invoice)
    .single();

  if (err1 || !packing) {
    return NextResponse.json(
      { error: "Packing not found" },
      { status: 404 }
    );
  }

  // ---------------------------------------------------------
  // 2) Obtener LÍNEAS de packing
  // ---------------------------------------------------------
  const { data: packingLines, error: err2 } = await supabase
    .from("packing_lines")
    .select("id, packing_id, box_no, code, description_en, form, size, pounds, combined_with")
    .eq("packing_id", packing.id);

  if (err2) {
    return NextResponse.json(
      { error: "Error loading packing lines" },
      { status: 500 }
    );
  }

  // ---------------------------------------------------------
  // 3) Obtener líneas de pricing (si existen)
  // ---------------------------------------------------------
  const { data: pricingLines, error: err3 } = await supabase
    .from("packing_pricing_lines")
    .select("*")
    .eq("packing_id", packing.id);

  if (err3) {
    return NextResponse.json(
      { error: "Error loading pricing lines" },
      { status: 500 }
    );
  }

  // ---------------------------------------------------------
  // RESPUESTA FINAL
  // ---------------------------------------------------------
  return NextResponse.json({
    packing: {
      header: packing,
      lines: packingLines ?? [],
    },
    pricing: pricingLines ?? [],
  });
}
