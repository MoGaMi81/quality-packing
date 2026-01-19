import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyPricing } from "@/domain/packing/pricing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type PricingPayload = {
  prices: Record<string, number>;
};

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const draftId = params.id;
    const body = (await req.json()) as PricingPayload;

    if (!body?.prices || typeof body.prices !== "object") {
      return NextResponse.json(
        { ok: false, error: "Payload de precios inválido" },
        { status: 400 }
      );
    }

    /* ================= VALIDAR DRAFT ================= */

    const { data: draft, error: draftErr } = await supabase
      .from("packing_drafts")
      .select("id, status")
      .eq("id", draftId)
      .single();

    if (draftErr || !draft) {
      return NextResponse.json(
        { ok: false, error: "Draft no encontrado" },
        { status: 404 }
      );
    }

    if (draft.status !== "TO_ADMIN") {
      return NextResponse.json(
        { ok: false, error: "Draft no está listo para pricing" },
        { status: 409 }
      );
    }

    /* ================= OBTENER LÍNEAS ================= */

    const { data: lines, error: linesErr } = await supabase
      .from("draft_lines")
      .select("*")
      .eq("draft_id", draftId)
      .order("box_no");

    if (linesErr || !lines || lines.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Draft sin líneas" },
        { status: 400 }
      );
    }

    /* ================= APLICAR PRICING ================= */

    const priced = applyPricing(lines, body.prices);

    /* ================= GUARDAR PRECIOS ================= */

    for (const l of priced) {
      const { error: updErr } = await supabase
        .from("draft_lines")
        .update({
          price: l.price,
          total_amount: l.total,
          price_key: l.priceKey,
        })
        .eq("id", l.id);

      if (updErr) {
        console.error("PRICING UPDATE ERROR:", updErr);
        return NextResponse.json(
          { ok: false, error: "Error guardando precios" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("PRICING FATAL ERROR:", e);
    return NextResponse.json(
      { ok: false, error: "Error inesperado en pricing" },
      { status: 500 }
    );
  }
}
