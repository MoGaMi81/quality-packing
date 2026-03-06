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
  const { data: draft, error } = await supabase
    .from("packing_drafts")
    .select("id, status")
    .eq("id", params.id)
    .single();

  if (error || !draft) {
    return NextResponse.json(
      { ok: false, error: "Draft no encontrado" },
      { status: 404 }
    );
  }

  if (draft.status !== "PROCESS") {
    return NextResponse.json(
      { ok: false, error: "El draft debe estar en PROCESS" },
      { status: 409 }
    );
  }

  const { error: updErr } = await supabase
    .from("packing_drafts")
    .update({ status: "PROCESS_DONE" })
    .eq("id", params.id);

  if (updErr) {
    return NextResponse.json(
      { ok: false, error: "No se pudo finalizar" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, status: "PROCESS_DONE" });
}
