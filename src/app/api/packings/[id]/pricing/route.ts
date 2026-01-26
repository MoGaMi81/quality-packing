import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// especies con precio único
const GROUPER_UNICO = [
  "BLACK GROUPER FRESH",
  "GAG GROUPER FRESH",
  "FiRE BAK GROUPER FRESH",
  "SCAMP GROUPER FRESH",
];

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
      {
        ok: false,
        error: `Packing no disponible para pricing`,
      },
      { status: 400 }
    );
  }

  /* =====================================================
     2️⃣ Obtener líneas
     ===================================================== */
  const { data: lines, error: linesError } = await supabase
    .from("packing_lines")
    .select("id, description_en, form, size")
    .eq("packing_id", packing_id);

  if (linesError || !lines || lines.length === 0) {
    return NextResponse.json(
      { ok: false, error: "El packing no tiene líneas" },
      { status: 400 }
    );
  }

  /* =====================================================
     3️⃣ Aplicar precios (LÓGICA CORRECTA)
     ===================================================== */
  for (const line of lines) {
    const keyLinea = `${line.description_en}|||${line.size}|||${line.form}`;

    let price = prices[keyLinea];

    // excepción: groupers con precio único
    if (
      (price == null || price <= 0) &&
      GROUPER_UNICO.includes(line.description_en)
    ) {
      price = prices[line.description_en];
    }

    if (price == null || price <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `Falta precio válido para ${line.description_en} ${line.form} ${line.size}`,
        },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("packing_lines")
      .update({ price })
      .eq("id", line.id);

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
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

  return NextResponse.json({ ok: true });
}
