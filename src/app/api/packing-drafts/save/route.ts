import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      draft_id,
      header,
      lines,
      status = "PROCESS",
    } = body as {
      draft_id?: string | null;
      header: {
        client_code: string;
        internal_ref: string;
      };
      lines: any[];
      status?: string;
    };

    if (!header?.client_code || !header?.internal_ref) {
      return NextResponse.json(
        { ok: false, error: "client_code e internal_ref son obligatorios" },
        { status: 400 }
      );
    }

    let draftId = draft_id ?? null;

    /* ================= CREAR / ACTUALIZAR DRAFT ================= */
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

      // limpiar líneas anteriores
      await supabase
        .from("draft_lines")
        .delete()
        .eq("draft_id", draftId);
    }

    /* ================= GUARDAR LÍNEAS ================= */
    if (Array.isArray(lines) && lines.length > 0) {
      const rows = lines.map((l) => ({
        draft_id: draftId,
        box_no: l.box_no,
        code: l.code,
        description_en: l.description_en,
        form: l.form,
        size: l.size,
        pounds: l.pounds,
        scientific_name: l.scientific_name ?? null,
        is_combined: l.is_combined ?? false,
        combined_with: l.combined_with ?? null,
      }));

      const { error } = await supabase
        .from("draft_lines")
        .insert(rows);

      if (error) throw error;
    }

    return NextResponse.json({
      ok: true,
      draft_id: draftId,
    });
  } catch (e: any) {
    console.error("SAVE DRAFT ERROR:", e);

    return NextResponse.json(
      { ok: false, error: e.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
