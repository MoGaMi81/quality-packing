import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("packings")
    .select("invoice_no")
    .not("invoice_no", "is", null);

  if (error || !data || data.length === 0) {
    return NextResponse.json({ invoice_no: null });
  }

  // 🔥 ordenar manual por número
  const sorted = data.sort((a, b) => {
    const numA = parseInt(a.invoice_no);
    const numB = parseInt(b.invoice_no);
    return numB - numA;
  });

  return NextResponse.json({
    invoice_no: sorted[0].invoice_no,
  });
}