import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      lines = [],
      status = "PROCESS",
    } = body;

    if (!header?.client_code || !header?.internal_ref) {
      return NextResponse.json(
        { ok: false, error: "Header incompleto" },
        { status: 400 }
      );
    }

    let draftId = draft_id ?? null;

    /* ============================
       1️⃣ CREAR O ACTUALIZAR DRAFT
    ============================ */

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

      if (error || !data?.id) {
        console.error(error);
        return NextResponse.json(
          { ok: false, error: "No se pudo crear el draft" },
          { status: 500 }
        );
      }

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

      if (error) {
        console.error(error);
        return NextResponse.json(
          { ok: false, error: "No se pudo actualizar el draft" },
          { status: 500 }
        );
      }
    }

    /* ============================
       2️⃣ REEMPLAZAR LÍNEAS
    ============================ */

    await supabase
      .from("packing_draft_lines")
      .delete()
      .eq("draft_id", draftId);

    if (lines.length > 0) {
      const rows = lines.map((l: any) => ({
        draft_id: draftId,
        box_no: l.box_no,
        is_combined: l.is_combined ?? false,
        code: l.code ?? null,
        description_en: l.description_en,
        form: l.form,
        size: l.size,
        pounds: l.pounds,
      }));

      const { error } = await supabase
        .from("packing_draft_lines")
        .insert(rows);

      if (error) {
        console.error(error);
        return NextResponse.json(
          { ok: false, error: "Error guardando líneas" },
          { status: 500 }
        );
      }
    }

    /* ============================
       3️⃣ RESPUESTA ESTABLE
    ============================ */

    return NextResponse.json({
      ok: true,
      draft_id: draftId,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: "Error inesperado en save draft" },
      { status: 500 }
    );
  }
}

