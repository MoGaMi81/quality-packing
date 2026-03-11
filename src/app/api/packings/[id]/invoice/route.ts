import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/requireRole";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  requireRole(_req, ["facturacion", "admin"]);

  const packingId = decodeURIComponent(params.id);

  const { data: packing, error: packingError } = await supabase
    .from("packings")
    .select("status")
    .eq("id", packingId)
    .single();

  if (packingError || !packing) {
    return NextResponse.json({ error: "Packing not found" }, { status: 404 });
  }

  if (packing.status !== "TO_ADMIN") {
    return NextResponse.json(
      { error: "Packing not ready for invoice" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("packings")
    .select(`
      id,
      invoice_no,
      client_code,
      created_at,
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
    .eq("id", packingId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Packing not found" }, { status: 404 });
  }

  const lines = (data.packing_lines ?? []).map((l: any) => ({
    pricing_key: l.pricing_key,
    species: l.species_name,
    form: l.form,
    lbs: Number(l.lbs ?? 0),
    price: Number(l.price ?? 0),
    total: Number(l.lbs ?? 0) * Number(l.price ?? 0),
  }));

  const totals = {
    total_boxes: (data.packing_lines ?? []).length,
    total_lbs: lines.reduce((s: number, l: any) => s + l.lbs, 0),
    total_usd: lines.reduce((s: number, l: any) => s + l.total, 0),
    small_boxes: (data.packing_lines ?? []).filter((l: any) =>
  ["1-2","2-4","3/4-1"].includes(l.size)
).length,

large_boxes: (data.packing_lines ?? []).filter((l: any) =>
  ["4-6","6-8","8-10","10UP"].includes(l.size)
).length,
  };

  return NextResponse.json({
    header: {
      invoice: data.invoice_no,
      client_name: data.clients?.[0]?.name ?? data.client_code ?? "",
      date: data.created_at,
    },
    lines,
    totals,
  });
}