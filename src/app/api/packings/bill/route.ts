import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { packing_id, invoice_no, guide } = await req.json();

  if (!packing_id || !invoice_no || !guide) {
    return NextResponse.json(
      { ok: false, error: "Datos incompletos" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("packings")
    .update({
      invoice_no: invoice_no.toUpperCase(),
      guide,
      status: "BILLED",
    })
    .eq("id", packing_id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

