// src/app/api/packings/ready-for-pricing/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
  .from("packings")
  .select("*");

if (error) {
  console.error("READY FOR PRICING ERROR:", error);
  return NextResponse.json(
    { ok: false, error },
    { status: 500 }
  );
}

return NextResponse.json({ ok: true, data });

}
