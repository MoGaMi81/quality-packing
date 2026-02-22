export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
     2️⃣ Actualizar precios por clave code|form|size
     ===================================================== */
  for (const key of Object.keys(prices)) {
    const price = prices[key];
    const [code, form, size] = key.split("|");

    if (!code || !form || !size) {
      return NextResponse.json(
        { ok: false, error: `Clave inválida: ${key}` },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("packing_lines")
      .update({ price })
      .eq("packing_id", packing_id)
      .eq("code", code)
      .eq("form", form)
      .eq("size", size);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }
  }

  /* =====================================================
     3️⃣ Marcar pricing como DONE
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