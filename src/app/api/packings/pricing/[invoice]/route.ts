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
  const invoice_no = params.invoice.toUpperCase();

  // Buscar pricing header
  const { data: pricing, error: err1 } = await supabase
    .from("packing_pricing")
    .select("*")
    .eq("invoice_no", invoice_no)
    .single();

  if (err1 || !pricing)
    return NextResponse.json({ lines: [] });

  // Buscar líneas
  const { data: lines } = await supabase
    .from("packing_pricing_lines")
    .select("*")
    .eq("pricing_id", pricing.id)
    .order("box_no");

  return NextResponse.json({
    pricing,
    lines: lines ?? []
  });
}

