// src/app/api/admin/packings/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

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
    id,
    invoice_no,
    created_at,
    pricing_status,
    clients (
    code,
    name
    )
  `)
  .eq("pricing_status", "PENDING")
  .order("created_at", { ascending: false });

  if (error) {
    console.error("ADMIN PACKINGS ERROR:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
  { packings: data },
  {
    headers: {
      "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  }
);
}
