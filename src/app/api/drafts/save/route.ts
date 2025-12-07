import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { id, client_code, draft_name, header, lines } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }

  // 1) Actualizar la tabla drafts
  const { error: e1 } = await supabase
    .from("drafts")
    .update({
      client_code,
      draft_name,
      header,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (e1) {
    return NextResponse.json({ error: e1.message }, { status: 500 });
  }

  // 2) Eliminar líneas anteriores
  await supabase.from("draft_lines").delete().eq("draft_id", id);

  // 3) Insertar nuevas líneas
  if (Array.isArray(lines) && lines.length > 0) {
    const insertRows = lines.map((ln: any, idx: number) => ({
      draft_id: id,
      line_no: idx + 1, // número de fila
      description_en: ln.description_en,
      size: ln.size,
      pounds: ln.pounds,
    }));

    const { error: e2 } = await supabase
      .from("draft_lines")
      .insert(insertRows);

    if (e2) {
      return NextResponse.json({ error: e2.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

