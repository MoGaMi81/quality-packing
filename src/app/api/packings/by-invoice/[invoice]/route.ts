import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  ctx: { params: { invoice: string } }
) {
  try {
    let invoice = ctx.params.invoice
      .trim()
      .replace(/\s+/g, "")
      .toUpperCase();

    // 1) Buscar el packing por invoice
    const { data: packing, error: err1 } = await supabase
      .from("packings")
      .select("*")
      .eq("invoice_no", invoice)
      .single();

    if (err1 || !packing) {
      console.log("NO SE ENCONTRÓ PACKING:", invoice);
      return NextResponse.json({ packing: null });
    }

    // 2) Traer líneas del packing
    const { data: lines, error: err2 } = await supabase
      .from("packing_lines")
      .select("*")
      .eq("packing_id", packing.id)
      .order("box_no", { ascending: true });

    if (err2) throw err2;

    return NextResponse.json({
      status: packing.status ?? "final",
      packing: {
        header: {
          client_code: packing.client_code,
          client_name: packing.client_name,
          address: packing.address,
          tax_id: packing.tax_id,
          guide: packing.guide,
          invoice_no: packing.invoice_no,
          date: packing.date,
        },
        lines: lines ?? [],
      },
    });

  } catch (e) {
    console.error("PACKING GET ERROR", e);
    return NextResponse.json({ packing: null });
  }
}

