import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { draft_id, lines } = body as {
      draft_id: string;
      lines: any[];
    };

    if (!draft_id || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Draft y líneas con precio son obligatorias" },
        { status: 400 }
      );
    }

    // Guardar pricing directamente en el draft
    const { error } = await supabase
      .from("packing_drafts")
      .update({
        priced_lines: lines,     // jsonb
        status: "PRICED",
      })
      .eq("id", draft_id)
      .eq("status", "BILLED"); // blindaje

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Error interno al guardar pricing" },
      { status: 500 }
    );
  }
}
