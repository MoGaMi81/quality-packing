import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { price } = await req.json();

  if (price == null) {
    return NextResponse.json(
      { ok: false, error: "Precio requerido" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("packing_lines")
    .update({ price })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}