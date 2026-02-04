import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { data, error } = await supabase
  .from("packings")
  .select(`
    id,
    invoice_no,
    created_at,
    pricing_status,
    clients (
      name
    ),
    packing_lines (
      description_en,
      form,
      size,
      pounds,
      price
    )
  `)
  .eq("id", id)
  .single();

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: "Packing no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, packing: data });
}
