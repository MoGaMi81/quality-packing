import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/requireRole";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: { id?: string } }
) {
  requireRole(req, ["proceso", "facturacion", "admin"]);
  const invoice = params.id?.toUpperCase();

  if (!invoice) {
    return NextResponse.json(
      { ok: false, error: "Invoice requerido" },
      { status: 400 }
    );
  }

  const { data: packing, error } = await supabase
    .from("packings")
    .select(`
      *,
      client:clients(name)
    `)
    .eq("invoice_no", invoice)
    .single();

  if (error || !packing) {
    return NextResponse.json(
      { ok: false, error: "Packing no encontrado" },
      { status: 404 }
    );
  }

  const { data: lines, error: linesError } = await supabase
    .from("packing_lines")
    .select("*")
    .eq("packing_id", packing.id)
    .order("box_no");

  if (linesError) {
    return NextResponse.json(
      { ok: false, error: linesError.message },
      { status: 500 }
    );
  }

  const packingWithName = {
    ...packing,
    client_name: packing.client?.name ?? null,
  };

  return NextResponse.json({
    ok: true,
    packing: packingWithName,
    lines: lines ?? [],
  });
}