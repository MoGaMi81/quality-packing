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
  const role = await getRoleFromRequest();

  if (!role) {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 401 }
    );
  }

  const STATUS_BY_ROLE: Record<string, string[]> = {
    proceso:     ["PROCESS"],
    facturacion: ["TO_BILLING"],
    admin:       ["TO_ADMIN"],
  };

  const statuses = STATUS_BY_ROLE[role] ?? [];

  const { data, error } = await supabase
    .from("packing_drafts")
    .select("id, client_code, internal_ref, status, created_at")
    .in("status", statuses)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, drafts: data });
}
