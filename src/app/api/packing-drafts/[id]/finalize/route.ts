import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TRANSITIONS: Record<string, { from: string; to: string }> = {
  proceso:     { from: "PROCESS",    to: "TO_BILLING" },
  facturacion: { from: "TO_BILLING", to: "TO_ADMIN" },
  admin:       { from: "TO_ADMIN",   to: "COMPLETED" },
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  // 🔑 Obtener rol desde header x-role
  const role = req.headers.get("x-role") as
    | "admin"
    | "proceso"
    | "facturacion"
    | null;

  if (!role || !TRANSITIONS[role]) {
    return NextResponse.json(
      { ok: false, error: "Rol no autorizado" },
      { status: 403 }
    );
  }

  const { from, to } = TRANSITIONS[role];

  // 1️⃣ Buscar draft
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

  // 2️⃣ Validar estado actual
  if (draft.status !== from) {
    return NextResponse.json(
      { ok: false, error: `Estado inválido. Se esperaba ${from}` },
      { status: 409 }
    );
  }

  // 3️⃣ Actualizar estado
  const { error: updErr } = await supabase
    .from("packing_drafts")
    .update({ status: to })
    .eq("id", params.id);

  if (updErr) {
    return NextResponse.json(
      { ok: false, error: "No se pudo finalizar" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, status: to });
}