import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  const { data: draft, error } = await supabase
    .from("packing_drafts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !draft) {
    return NextResponse.json(
      { ok: false, error: "Draft no encontrado" },
      { status: 404 }
    );
  }

  // 🔵 buscar nombre manualmente
  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("code", draft.client_code)
    .single();

  const { data: lines, error: linesError } = await supabase
    .from("draft_lines")
    .select("*")
    .eq("draft_id", id)
    .order("box_no");

  if (linesError) {
    return NextResponse.json(
      { ok: false, error: linesError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
  ok: true,
  draft: {
    id: draft.id,
    client_code: draft.client_code,
    client_name: client?.name ?? draft.client_code,
    guide: draft.guide ?? null,
    created_at: draft.created_at,
  },
  lines: lines ?? [],
});
}