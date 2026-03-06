import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  
const role = _req.headers.get("x-role");

if (role !== "admin") {
  return NextResponse.json({ ok: false }, { status: 403 });
}
  
  const { error } = await supabase
    .from("packings")
    .update({ pricing_status: "PENDING" })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}