import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const packingId = params.id;

  if (!packingId) {
    return NextResponse.json(
      { ok: false, error: "Missing packing id" },
      { status: 400 }
    );
  }

  /* =====================
     1️⃣ Header
  ===================== */
  const { data: packing, error: err1 } = await supabase
    .from("packings")
    .select("*")
    .eq("id", packingId)
    .single();

  if (err1 || !packing) {
    return NextResponse.json(
      { ok: false, error: "Packing not found" },
      { status: 404 }
    );
  }

  /* =====================
     2️⃣ Líneas
  ===================== */
  const { data: lines, error: err2 } = await supabase
    .from("packing_lines")
    .select("*")
    .eq("packing_id", packingId)
    .order("box_no");

  if (err2) {
    return NextResponse.json(
      { ok: false, error: err2.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    packing,
    lines: lines ?? [],
  });
}
