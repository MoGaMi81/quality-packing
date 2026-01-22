// src/app/api/packings/ready-for-pricing/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
  .from("packings")
  .select(`
    invoice_no,
    client_code,
    created_at,
    total_boxes,
    total_lbs
  `)
  .eq("pricing_status", "PENDING")
  .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    packings: data ?? []
  });
}
