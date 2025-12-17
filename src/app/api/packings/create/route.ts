import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();
  const { invoice_no, client_code, client_name, address, date } = body;

  if (!invoice_no || !client_code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // avoid duplicates
  const { data: exists } = await supabase
    .from("packings")
    .select("id")
    .eq("invoice_no", invoice_no.toUpperCase())
    .single();

  if (exists)
    return NextResponse.json({ exists: true }, { status: 200 });

  // create header
  const { data, error } = await supabase
    .from("packings")
    .insert([
      {
        invoice_no: invoice_no.toUpperCase(),
        client_code,
        client_name,
        address,
        date,
      },
    ])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, packing: data });
}
