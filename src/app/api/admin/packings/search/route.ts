import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ packings: [] });
  }

  const { data, error } = await supabase
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ packings: data });
}
