import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/requireRole"; // 🔥 agregado

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("packing_drafts")
    .select(`
      id,
      client_code,
      internal_ref,
      created_at
    `)
    .eq("status", "PROCESS_DONE")
    .is("invoice_no", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[FACTURACION_PENDING]", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ ok: true, rows: [] });
  }

  const codes = [...new Set(data.map(d => d.client_code))];

  const { data: clients } = await supabase
    .from("clients")
    .select("code, name")
    .in("code", codes);

  const clientMap = new Map<string, string>();

  if (clients) {
    for (const c of clients) {
      clientMap.set(c.code, c.name);
    }
  }

  const rowsWithName = data.map(d => ({
    ...d,
    client_name: clientMap.get(d.client_code) ?? d.client_code,
  }));

  return NextResponse.json(
    { ok: true, rows: rowsWithName },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  // 🔒 Verificación de rol
   requireRole(req, ["proceso", "facturacion", "admin"]);
  requireRole(req, ["admin"]); // ✅ agregado

  const { data: packing, error } = await supabase
    .from("packings")
    .select("status")
    .eq("id", params.id)
    .single();

  if (error || !packing) {
    return NextResponse.json(
      { error: "Packing not found" },
      { status: 404 }
    );
  }

  if (packing.status !== "TO_BILLING") {
    return NextResponse.json(
      { error: "Packing not ready for pricing" },
      { status: 400 }
    );
  }

  // 🔒 Verificación de rol
  requireRole(req, ["admin"]);

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
  const { data: packing2, error: packingError } = await supabase
    .from("packings")
    .select("id, status, pricing_status")
    .eq("id", packing_id)
    .single();

  if (packingError || !packing2) {
    return NextResponse.json(
      { ok: false, error: "Packing no encontrado" },
      { status: 404 }
    );
  }

  if (packing2.status !== "READY" || packing2.pricing_status !== "PENDING") {
    return NextResponse.json(
      { ok: false, error: "Packing no disponible para pricing" },
      { status: 400 }
    );
  }
  /* =====================================================
     2️⃣ Actualización precios por clave code|form|size
     ===================================================== */
  for (const key of Object.keys(prices)) {
    const price = prices[key];

    if (key === "GROUPER_WG") {
      const { error } = await supabase
        .from("packing_lines")
        .update({ price })
        .eq("packing_id", packing_id)
        .eq("form", "W&G")
        .ilike("description_en", "%GROUPER%")
        .not("description_en", "ilike", "%FILLET%");

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 }
        );
      }

      continue;
    }

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