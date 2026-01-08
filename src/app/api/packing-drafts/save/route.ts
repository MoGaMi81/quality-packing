import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function GET() {
  const { data } = await supabase
    .from("packing_drafts")
    .select("id, client_code, internal_ref, status, updated_at")
    .order("updated_at", { ascending: false });

  return NextResponse.json({ ok: true, drafts: data ?? [] });
}
