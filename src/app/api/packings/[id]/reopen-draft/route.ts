import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const packingId = params.id;

  const { error } = await supabase
    .from("packings")
    .update({
      pricing_status: "DRAFT",
      invoice_no: null,
      guide: null,
    })
    .eq("id", packingId);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}