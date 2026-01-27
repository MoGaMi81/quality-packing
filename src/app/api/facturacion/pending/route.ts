import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("packing_drafts")
    .select(`
      id,
      client_code,
      created_at,
      total_boxes,
      total_lbs
    `)
    .eq("status", "PROCESS_DONE")
    .is("invoice_no", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[FACTURACION_PENDING]", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    rows: data ?? [],
  });
}
