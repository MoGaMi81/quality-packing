import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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
      internal_ref,
      created_at
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

  if (!data) {
    return NextResponse.json({ ok: true, rows: [] });
  }

  // 🔵 resolver nombres
  const codes = [...new Set(data.map(d => d.client_code))];

  const { data: clients } = await supabase
    .from("clients")
    .select("code, name")
    .in("code", codes);

  const clientMap = new Map<string, string>();

  if (clients) {
    for (const c of clients) {
      clientMap.set(c.code, c.name);
    }
  }

  const rowsWithName = data.map(d => ({
    ...d,
    client_name: clientMap.get(d.client_code) ?? d.client_code
  }));

  return NextResponse.json(
    { ok: true, rows: rowsWithName },
    { headers: { "Cache-Control": "no-store" } }
  );
}