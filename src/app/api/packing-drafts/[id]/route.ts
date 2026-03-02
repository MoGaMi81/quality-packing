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
  .select(`
    *,
    client:clients(name)
  `)
  .eq("id", params.id)
  .single();

if (error || !draft) {
  return NextResponse.json(
    { ok: false, error: "Draft no encontrado" },
    { status: 404 }
  );
}

const { data: lines, error: linesError } = await supabase
  .from("draft_lines")
  .select("*")
  .eq("draft_id", params.id)
  .order("box_no");

if (linesError) {
  return NextResponse.json(
    { ok: false, error: linesError.message },
    { status: 500 }
  );
}

const draftWithName = {
  ...draft,
  client_name: draft.client?.name ?? null,
};

return NextResponse.json({
  ok: true,
  draft: draftWithName,
  lines: lines ?? [],
});
}
