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
  const packingId = decodeURIComponent(params.id);

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
  .eq("id", params.id)
  .single();

  if (error || !data) {
    return NextResponse.json({ error: "Packing not found" }, { status: 404 });
  }

  // 🔹 líneas ya pricadas (solo lectura)
  const lines = (data.packing_lines ?? []).map((l: any) => ({
    pricing_key: l.pricing_key,
    species: l.species_name,
    form: l.form,
    lbs: Number(l.lbs ?? 0),
    price: Number(l.price ?? 0),
    total: Number(l.lbs ?? 0) * Number(l.price ?? 0),
  }));

  const totals = {
    total_lbs: lines.reduce((s: number, l: any) => s + l.lbs, 0),
    total_usd: lines.reduce((s: number, l: any) => s + l.total, 0),
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
