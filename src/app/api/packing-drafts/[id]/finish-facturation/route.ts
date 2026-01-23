import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const draft_id = params.id;
  const { invoice_no, guide } = (await req.json()) as {
    invoice_no?: string;
    guide?: string;
  };

  if (!invoice_no || !guide) {
    return NextResponse.json(
      { ok: false, error: "Factura y guía son obligatorias" },
      { status: 400 }
    );
  }

  /* =====================================================
     1️⃣ Obtener draft (y validar estado)
     ===================================================== */
  const { data: draft, error: draftError } = await supabase
    .from("packing_drafts")
    .select("*")
    .eq("id", draft_id)
    .single();

  if (draftError || !draft) {
    return NextResponse.json(
      { ok: false, error: "Draft no encontrado" },
      { status: 404 }
    );
  }

  if (draft.status !== "PROCESS_DONE") {
    return NextResponse.json(
      {
        ok: false,
        error: `El draft no está listo para facturación (estado actual: ${draft.status})`,
      },
      { status: 400 }
    );
  }

  /* =====================================================
     2️⃣ Obtener líneas del draft
     ===================================================== */
  const { data: draftLines, error: linesError } = await supabase
    .from("draft_lines")
    .select("*")
    .eq("draft_id", draft_id);

  if (linesError || !draftLines || draftLines.length === 0) {
    return NextResponse.json(
      { ok: false, error: "El draft no tiene líneas" },
      { status: 400 }
    );
  }

  /* =====================================================
     3️⃣ Crear PACKING (AQUÍ NACE)
     ===================================================== */
  const { data: packing, error: packingError } = await supabase
    .from("packings")
    .insert({
      invoice_no: invoice_no.toUpperCase(),
      guide,
      client_code: draft.client_code,
      pricing_status: "PENDING",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (packingError || !packing) {
    return NextResponse.json(
      { ok: false, error: packingError?.message || "No se pudo crear packing" },
      { status: 500 }
    );
  }

  /* =====================================================
     4️⃣ Copiar líneas → packing_lines
     ===================================================== */
  const packingLines = draftLines.map((l: any) => ({
    packing_id: packing.id,
    box_no: l.box_no,
    species_code: l.species_code,
    description_en: l.description_en,
    form: l.form,
    size: l.size,
    pounds: l.pounds,
  }));

  const { error: insertLinesError } = await supabase
    .from("packing_lines")
    .insert(packingLines);

  if (insertLinesError) {
    return NextResponse.json(
      { ok: false, error: insertLinesError.message },
      { status: 500 }
    );
  }

  /* =====================================================
     5️⃣ Marcar draft como BILLED
     ===================================================== */
  const { error: updateDraftError } = await supabase
    .from("packing_drafts")
    .update({
      invoice_no: invoice_no.toUpperCase(),
      guide,
      status: "BILLED",
    })
    .eq("id", draft_id);

  if (updateDraftError) {
    return NextResponse.json(
      { ok: false, error: updateDraftError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    packing_id: packing.id,
  });
}
