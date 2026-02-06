export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyPricing } from "@/domain/packing/pricing";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const packing_id = params.id;
  const { prices } = (await req.json()) as {
    prices: Record<string, number>;
  };

  if (!prices || Object.keys(prices).length === 0) {
    return NextResponse.json(
      { ok: false, error: "No se recibieron precios" },
      { status: 400 }
    );
  }

  /* =====================================================
     1️⃣ Obtener packing
     ===================================================== */
  const { data: packing, error: packingError } = await supabase
    .from("packings")
    .select("id, status, pricing_status")
    .eq("id", packing_id)
    .single();

  if (packingError || !packing) {
    return NextResponse.json(
      { ok: false, error: "Packing no encontrado" },
      { status: 404 }
    );
  }

  if (packing.status !== "READY" || packing.pricing_status !== "PENDING") {
    return NextResponse.json(
      { ok: false, error: "Packing no disponible para pricing" },
      { status: 400 }
    );
  }

  /* =====================================================
     2️⃣ Obtener líneas COMPLETAS (PackingLine)
     ===================================================== */
  const { data: lines, error: linesError } = await supabase
    .from("packing_lines")
    .select(`
      id,
      code,
      description_en,
      form,
      size,
      pounds,
      box_no,
      is_combined,
      combined_with
    `)
    .eq("packing_id", packing_id);

  if (linesError || !lines || lines.length === 0) {
    return NextResponse.json(
      { ok: false, error: "El packing no tiene líneas" },
      { status: 400 }
    );
  }

  /* =====================================================
     3️⃣ Aplicar precios USANDO EL ENGINE (única verdad)
     ===================================================== */
  const priced = applyPricing(lines, prices);

  for (const l of priced) {
    if (!l.price || l.price <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Falta precio válido para ${l.description_en} ${l.form} ${l.size}`,
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("packing_lines")
      .update({ price: l.price })
      .eq("id", l.id);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }
  }

  /* =====================================================
     4️⃣ Marcar pricing como DONE
     ===================================================== */
  const { error: updatePackingError } = await supabase
    .from("packings")
    .update({ pricing_status: "DONE" })
    .eq("id", packing_id);

  if (updatePackingError) {
    return NextResponse.json(
      { ok: false, error: updatePackingError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
