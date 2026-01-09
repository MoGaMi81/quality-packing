import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ================= SUPABASE ================= */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ================= HELPERS ================= */
function isUUID(v: any): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      v
    )
  );
}

/* ================= POST ================= */
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
      lines?: any[];
      status?: string;
    };

    /* ================= VALIDACIONES ================= */
    if (!header?.client_code || !header?.internal_ref) {
      return NextResponse.json(
        { ok: false, error: "client_code e internal_ref son obligatorios" },
        { status: 400 }
      );
    }

    let draftId: string;

    /* ================= CREAR O ACTUALIZAR DRAFT ================= */
    if (!isUUID(draft_id)) {
      // 👉 CREAR NUEVO DRAFT
      const { data, error } = await supabase
        .from("packing_drafts")
        .insert({
          client_code: header.client_code,
          internal_ref: header.internal_ref,
          status,
        })
        .select("id::uuid") // fuerza UUID si el tipo en DB lo permite
        .single();

      if (error) throw error;

      draftId = data.id;
    } else {
      // 👉 ACTUALIZAR DRAFT EXISTENTE
      draftId = draft_id;

      const { error } = await supabase
        .from("packing_drafts")
        .update({
          client_code: header.client_code,
          internal_ref: header.internal_ref,
          status,
        })
        .eq("id", draftId);

      if (error) throw error;

      // 👉 BORRAR LÍNEAS ANTERIORES (SOLO SI UUID VÁLIDO)
      const { error: delErr } = await supabase
        .from("draft_lines")
        .delete()
        .eq("draft_id", draftId);

      if (delErr) throw delErr;
    }

    /* ================= GUARDAR LÍNEAS ================= */
    if (Array.isArray(lines) && lines.length > 0) {
      const rows = lines.map((l) => ({
        draft_id: draftId,
        box_no: typeof l.box_no === "number" ? l.box_no : null,
        code: String(l.code ?? ""),
        description_en: String(l.description_en ?? ""),
        form: String(l.form ?? ""),
        size: String(l.size ?? ""),
        pounds: Number(l.pounds) || 0,
        scientific_name: l.scientific_name ?? null,
        is_combined: !!l.is_combined,
        combined_with:
          l.combined_with !== undefined && l.combined_with !== null
            ? String(l.combined_with)
            : null,
      }));

      const { error } = await supabase
        .from("draft_lines")
        .insert(rows);

      if (error) throw error;
    }

    /* ================= OK ================= */
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
