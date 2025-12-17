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

  // 1) Buscar packing
  const { data: packing, error: err1 } = await supabase
    .from("packings")
    .select("*")
    .eq("invoice_no", invoice_no)
    .single();

  if (err1 || !packing) {
    return NextResponse.json({ packing: null }, { status: 404 });
  }

  // 2) Buscar líneas
  const { data: lines, error: err2 } = await supabase
    .from("packing_lines")
    .select("*")
    .eq("packing_id", packing.id)
    .order("box_no", { ascending: true });

  return NextResponse.json({
    packing: {
      ...packing,
      lines: lines ?? []
    }
  });
}


