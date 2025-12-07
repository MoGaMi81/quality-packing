import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);

  // Obtener draft
  const { data: draft, error: e1 } = await supabase
    .from("drafts")
    .select("*")
    .eq("id", id)
    .single();

  if (e1 || !draft) {
    return NextResponse.json(
      { error: e1?.message || "Draft no encontrado" },
      { status: 500 }
    );
  }

  // Obtener líneas
  const { data: lines, error: e2 } = await supabase
    .from("draft_lines")
    .select("*")
    .eq("draft_id", id)
    .order("box_no");

  if (e2) {
    return NextResponse.json({ error: e2.message }, { status: 500 });
  }

  return NextResponse.json({
    id: draft.id,
    client_code: draft.client_code,
    draft_name: draft.draft_name,
    header: draft.header || {},
    lines: lines || []
  });
}
