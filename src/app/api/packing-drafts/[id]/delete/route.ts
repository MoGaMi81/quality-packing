import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  // 1) Validar draft
  const { data: draft, error: dErr } = await supabase
    .from("packing_drafts")
    .select("id, status")
    .eq("id", id)
    .single();

  if (dErr || !draft) {
    return NextResponse.json(
      { ok: false, error: "Draft no encontrado" },
      { status: 404 }
    );
  }

  // 2) Solo drafts en PROCESS
  if (draft.status !== "PROCESS") {
    return NextResponse.json(
      { ok: false, error: "Solo se pueden eliminar drafts en PROCESS" },
      { status: 409 }
    );
  }

  // 3) Borrar líneas primero
  const { error: delLinesErr } = await supabase
    .from("draft_lines")
    .delete()
    .eq("draft_id", id);

  if (delLinesErr) {
    return NextResponse.json(
      { ok: false, error: "Error borrando líneas del draft" },
      { status: 500 }
    );
  }

  // 4) Borrar draft
  const { error: delDraftErr } = await supabase
    .from("packing_drafts")
    .delete()
    .eq("id", id);

  if (delDraftErr) {
    return NextResponse.json(
      { ok: false, error: "Error borrando draft" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
