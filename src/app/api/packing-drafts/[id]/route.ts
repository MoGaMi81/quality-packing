import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const draftId = params.id;

  const { data: draft, error } = await supabase
    .from("packing_drafts")
    .select("*")
    .eq("id", draftId)
    .single();

  if (error || !draft) {
    return NextResponse.json(
      { ok: false, error: "Draft no encontrado" },
      { status: 404 }
    );
  }

  const { data: lines } = await supabase
    .from("draft_lines")
    .select("*")
    .eq("draft_id", draftId)
    .order("box_no");

  return NextResponse.json({
    ok: true,
    draft,
    lines: lines ?? [],
  });
}


