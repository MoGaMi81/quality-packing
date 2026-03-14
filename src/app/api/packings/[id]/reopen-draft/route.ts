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

  // 1️⃣ Obtener packing
  const { data: packing, error: e1 } = await supabase
    .from("packings")
    .select("*")
    .eq("id", packingId)
    .single();

  if (e1 || !packing) {
    return NextResponse.json({ ok: false, error: "Packing no encontrado" });
  }

  // 2️⃣ Crear draft
  const { data: draft, error: e2 } = await supabase
    .from("packing_drafts")
    .insert({
      client_code: packing.client_code,
      internal_ref: packing.invoice_no ?? "REOPEN",
      status: "DRAFT",
    })
    .select()
    .single();

  if (e2 || !draft) {
    return NextResponse.json({ ok: false, error: e2?.message });
  }

  // 3️⃣ Traer líneas del packing
  const { data: lines } = await supabase
    .from("packing_lines")
    .select("*")
    .eq("packing_id", packingId);

  if (lines && lines.length > 0) {
    const draftLines = lines.map((l: any) => ({
      draft_id: draft.id,
      box_no: l.box_no,
      code: l.code,
      description_en: l.description_en,
      form: l.form,
      size: l.size,
      pounds: l.pounds,
      is_combined: l.is_combined,
      combined_with: l.combined_with,
    }));

    await supabase.from("draft_lines").insert(draftLines);
  }


  await supabase
    .from("packings")
    .update({
      pricing_status: "REOPENED",
      invoice_no: null,
      guide: null,
    })
    .eq("id", packingId);

  return NextResponse.json({
    ok: true,
    draftId: draft.id,
  });
}