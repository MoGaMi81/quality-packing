import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/* ================= HELPERS ================= */

function isUUID(v: unknown): v is string {
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
      draft_id = null,
      header,
      lines = [],
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

    if (!header?.client_code || !header?.internal_ref) {
      return NextResponse.json(
        { ok: false, error: "client_code e internal_ref son obligatorios" },
        { status: 400 }
      );
    }

    let id: string;

    /* ========= CREAR O ACTUALIZAR DRAFT ========= */

    if (!isUUID(draft_id)) {
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
        console.error("CREATE DRAFT ERROR:", error);
        return NextResponse.json(
          { ok: false, error: "No se pudo crear el draft" },
          { status: 500 }
        );
      }

      id = data.id;
    } else {
      id = draft_id;

      const { error: updErr } = await supabase
        .from("packing_drafts")
        .update({
          client_code: header.client_code,
          internal_ref: header.internal_ref,
          status,
        })
        .eq("id", id);

      if (updErr) {
        console.error("UPDATE DRAFT ERROR:", updErr);
        return NextResponse.json(
          { ok: false, error: "No se pudo actualizar el draft" },
          { status: 500 }
        );
      }

      /* 🔥 BORRAR LÍNEAS ANTERIORES (CONTROLADO) */
      const { error: delErr } = await supabase
        .from("draft_lines")
        .delete()
        .eq("draft_id", id);

      if (delErr) {
        console.error("DELETE LINES ERROR:", delErr);
        return NextResponse.json(
          { ok: false, error: "No se pudieron borrar líneas previas" },
          { status: 500 }
        );
      }
    }

    /* ========= INSERTAR LÍNEAS ========= */

    console.log("SAVE DRAFT:", id, "LINES:", lines.length);

    if (Array.isArray(lines) && lines.length > 0) {
      const rows = lines.map((l: any) => ({
        draft_id: id,
        box_no: typeof l.box_no === "number" ? l.box_no : null,
        code: l.code ?? null,
        description_en: l.description_en ?? "",
        form: l.form ?? "",
        size: l.size ?? "",
        pounds: Number(l.pounds) || 0,
        scientific_name: l.scientific_name ?? null,
        is_combined: !!l.is_combined,
        combined_with:
          l.combined_with !== undefined && l.combined_with !== null
            ? String(l.combined_with)
            : null,
      }));

      const { error: insErr } = await supabase
        .from("draft_lines")
        .insert(rows);

      if (insErr) {
        console.error("INSERT LINES ERROR:", insErr);
        return NextResponse.json(
          { ok: false, error: "Error guardando líneas" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true, draft_id: id });
  } catch (e: any) {
    console.error("SAVE DRAFT FATAL ERROR:", e);
    return NextResponse.json(
      { ok: false, error: "Error inesperado en save draft" },
      { status: 500 }
    );
  }
}
