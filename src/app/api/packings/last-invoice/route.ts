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
    .not("invoice_no", "is", null)
    .order("invoice_no", { ascending: false }) // 🔥 cambio aquí
    .limit(1);

  return NextResponse.json({
    invoice_no: data?.[0]?.invoice_no ?? null,
  });
}