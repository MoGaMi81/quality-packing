import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request, ctx: any) {
  const invoice = ctx.params.invoice;

  if (!invoice) {
    return NextResponse.json({ ok: false, error: "Missing invoice" });
  }

  // 1) header
  const { data: packing, error: err1 } = await supabase
    .from("packings")
    .select("*")
    .eq("invoice_no", invoice.toUpperCase())
    .single();

  if (err1 || !packing) {
    return NextResponse.json({ ok: false, packing: null });
  }

  // 2) lines
  const { data: lines, error: err2 } = await supabase
    .from("packing_lines")
    .select("*")
    .eq("packing_id", packing.id)
    .order("box_no");

  return NextResponse.json({
    ok: true,
    packing,
    lines: lines ?? []
  });
}
