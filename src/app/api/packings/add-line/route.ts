import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.json();
  const { packing_id, box_no, code, description_en, form, size, pounds, scientific_name } = body;

  if (!packing_id || !box_no || !description_en)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { error } = await supabase.from("packing_lines").insert([
    {
      packing_id,
      box_no,
      code,
      description_en,
      form,
      size,
      pounds,
      scientific_name
    },
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
