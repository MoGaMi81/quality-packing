import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const invoice = searchParams.get("no")?.toUpperCase();

  if (!invoice) {
    return NextResponse.json({ error: "Missing invoice number" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("packings")
    .select("id, invoice_no, status")
    .eq("invoice_no", invoice)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ exists: false });
  }

  return NextResponse.json({ exists: true, data });
}
