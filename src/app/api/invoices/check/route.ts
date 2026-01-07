import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const invoice = (searchParams.get("no") ?? "")?.trim().toUpperCase();

  if (!invoice) {
    return NextResponse.json({ error: "Missing invoice" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("packings")
    .select("id")
    .eq("invoice_no", invoice)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    exists: !!data,
  });
}
