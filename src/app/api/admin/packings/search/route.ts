import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toUpperCase();

  if (!q) {
    return NextResponse.json({ packings: [] });
  }

  // 1️⃣ Intentar búsqueda EXACTA
  let { data, error } = await supabase
    .from("packings")
    .select(`
      id,
      invoice_no,
      created_at,
      clients ( name )
    `)
    .eq("pricing_status", "DONE")
    .eq("invoice_no", q)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 2️⃣ Si no hay resultados, buscar parcial
  if (!data || data.length === 0) {
    const res = await supabase
      .from("packings")
      .select(`
        id,
        invoice_no,
        created_at,
        clients ( name )
      `)
      .eq("pricing_status", "DONE")
      .ilike("invoice_no", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (res.error) {
      return NextResponse.json({ error: res.error.message }, { status: 500 });
    }

    data = res.data ?? [];
  }

  return NextResponse.json({ packings: data });
}
