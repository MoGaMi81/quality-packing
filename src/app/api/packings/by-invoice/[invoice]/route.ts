import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: { invoice?: string } }
) {
  const invoice = params.invoice?.toUpperCase();

  // 👇 Blindaje total
  if (!invoice) {
    return NextResponse.json({ ok: true, packing: null });
  }

  const { data, error } = await supabase
    .from("packings")
    .select("*")
    .eq("invoice_no", invoice)
    .eq("status", "DRAFT")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ ok: true, packing: null });
  }

  const packing = data[0];

  const { data: lines } = await supabase
    .from("packing_lines")
    .select("*")
    .eq("packing_id", packing.id)
    .order("box_no");

  return NextResponse.json({
    ok: true,
    packing,
    lines: lines ?? [],
  });
}
