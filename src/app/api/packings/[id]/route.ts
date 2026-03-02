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
  const { data: packing, error } = await supabase
    .from("packings")
    .select(`
      id,
      invoice_no,
      client_code,
      created_at,
      pricing_status
    `)
    .eq("id", params.id)
    .single();

  if (error || !packing) {
    return NextResponse.json(
      { ok: false, error: "Packing no encontrado" },
      { status: 404 }
    );
  }

  // 🔵 Resolver nombre manualmente
  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("code", packing.client_code)
    .single();

  const { data: lines } = await supabase
    .from("packing_lines")
    .select(`
      code,
      box_no,
      is_combined,
      combined_with,
      description_en,
      form,
      size,
      pounds,
      price
    `)
    .eq("packing_id", packing.id)
    .order("box_no");

  return NextResponse.json(
    {
      ok: true,
      packing: {
        ...packing,
        client_name: client?.name ?? packing.client_code,
        packing_lines: lines ?? [],
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}