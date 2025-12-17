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

  if (!invoice) {
    return NextResponse.json(
      { ok: false, error: "Missing invoice param" },
      { status: 400 }
    );
  }

  // Get header
  const { data: packing, error } = await supabase
    .from("packings")
    .select("*")
    .eq("invoice_no", invoice)
    .single();

  if (!packing) {
    return NextResponse.json({ ok: false, error: "Packing not found" }, { status: 404 });
  }

  // Get lines
  const { data: lines } = await supabase
    .from("packing_lines")
    .select("*")
    .eq("packing_id", packing.id)
    .order("box_no", { ascending: true });

  return NextResponse.json({
    ok: true,
    packing: { ...packing, lines: lines ?? [] },
  });
}
