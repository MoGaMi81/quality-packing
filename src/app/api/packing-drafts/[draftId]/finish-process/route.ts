import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  req: Request,
  { params }: { params: { draftId: string } }
) {
  const draftId = params.draftId;

  const { error } = await supabase
    .from("packing_drafts")
    .update({ status: "PROCESS_DONE" })
    .eq("id", draftId)
    .eq("status", "PROCESS"); // blindaje

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
