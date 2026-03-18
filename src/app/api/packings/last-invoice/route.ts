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
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json({ invoice_no: null });
  }

  return NextResponse.json({
    invoice_no: data?.invoice_no ?? null,
  });
}