import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRoleFromRequest } from "@/lib/role-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  // 🔑 Obtener rol (opcional, ya no bloquea si es null)
  const role = await getRoleFromRequest();

  // Mapear estados según rol, si existe
  const STATUS_BY_ROLE: Record<string, string[]> = {
    proceso: ["PROCESS"],
    facturacion: ["TO_BILLING"],
    admin: ["TO_ADMIN"],
  };

  // Si no hay rol, devolver todos los drafts
  const statuses = role ? STATUS_BY_ROLE[role] ?? [] : [];

  let query = supabase
    .from("packing_drafts")
    .select("id, client_code, internal_ref, status, created_at")
    .order("created_at", { ascending: false });

  // Si hay rol válido, filtrar por estados; si no, traer todo
  if (statuses.length > 0) {
    query = query.in("status", statuses);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, drafts: data });
}