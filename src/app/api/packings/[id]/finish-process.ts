import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const packingId = params.id;

  // 1) Traer packing
  const { data: packing, error } = await supabase
    .from("packings")
    .select("id, status, client_code, internal_ref")
    .eq("id", packingId)
    .single();

  if (error || !packing) {
    return NextResponse.json({ ok: false, error: "Packing no encontrado" }, { status: 404 });
  }

  if (packing.status !== "DRAFT") {
    return NextResponse.json({ ok: false, error: "Estado inválido" }, { status: 400 });
  }

  if (!packing.client_code || !packing.internal_ref) {
    return NextResponse.json(
      { ok: false, error: "Cliente o identificador incompleto" },
      { status: 400 }
    );
  }

  // 2) Verificar que tenga líneas
  const { count } = await supabase
    .from("packing_lines")
    .select("*", { count: "exact", head: true })
    .eq("packing_id", packingId);

  if (!count || count === 0) {
    return NextResponse.json(
      { ok: false, error: "No hay cajas capturadas" },
      { status: 400 }
    );
  }

  // 3) Cambiar estado
  const { error: err2 } = await supabase
    .from("packings")
    .update({
      status: "READY",
      process_completed_at: new Date().toISOString(),
    })
    .eq("id", packingId);

  if (err2) {
    return NextResponse.json({ ok: false, error: err2.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
