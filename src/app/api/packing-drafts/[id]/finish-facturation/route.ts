import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const body = await req.json();

  const { invoice_no, guide } = body as {
    invoice_no?: string;
    guide?: string;
  };

  if (!invoice_no || !guide) {
    return NextResponse.json(
      { ok: false, error: "Factura y guía son obligatorias" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("packing_drafts")
    .update({
      invoice_no,
      guide,
      status: "BILLED",
    })
    .eq("id", id)
    .eq("status", "PROCESS_DONE"); // blindaje

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
