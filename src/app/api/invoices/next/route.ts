export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data } = await supabase
    .from("packings")
    .select("invoice_no")
    .order("invoice_no", { ascending: false })
    .limit(1);

  const last = data?.[0]?.invoice_no || "0";

  const next = String((parseInt(last) || 0) + 1);

  return NextResponse.json({ next });
}