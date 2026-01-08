import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();

  const {
    draft_id,
    header,
    lines,
    status = "PROCESS",
  } = body;

  if (!header?.client_code || !header?.internal_ref) {
    return NextResponse.json(
      { ok: false, error: "client_code e internal_ref son obligatorios" },
      { status: 400 }
    );
  }

  let draftId = draft_id ?? null;

  if (!draftId) {
    const { data, error } = await supabase
      .from("packing_drafts")
      .insert({
        client_code: header.client_code,
        internal_ref: header.internal_ref,
        status,
      })
      .select("id")
      .single();

    if (error) throw error;
    draftId = data.id;
  } else {
    const { error } = await supabase
      .from("packing_drafts")
      .update({
        client_code: header.client_code,
        internal_ref: header.internal_ref,
        status,
      })
      .eq("id", draftId);

    if (error) throw error;

    await supabase
      .from("draft_lines")
      .delete()
      .eq("draft_id", draftId);
  }

  if (lines?.length) {
    await supabase.from("draft_lines").insert(
      lines.map((l: any) => ({
        draft_id: draftId,
        ...l,
      }))
    );
  }

  return NextResponse.json({ ok: true, draft_id: draftId });
}
