export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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
  const { data, error } = await supabase
    .from("packings")
    .select(`
      id,
      invoice_no,
      client_code,
      created_at,
      pricing_status,
      clients (
        name
      ),
      packing_lines (
        code,
        box_no,
        is_combined,
        combined_with,
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
    return NextResponse.json(
      { ok: false, error: "Packing no encontrado" },
      { status: 404 }
    );
  }

  // 🔥 Transformamos la estructura
  const formattedPacking = {
    id: data.id,
    invoice_no: data.invoice_no,
    client_code: data.client_code,
    client_name: data.clients?.[0]?.name ?? data.client_code,
    created_at: data.created_at,
    pricing_status: data.pricing_status,
    packing_lines: data.packing_lines ?? [],
  };

  return NextResponse.json(
    {
      ok: true,
      packing: formattedPacking,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}