import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code?.toUpperCase();

  if (!code) {
    return NextResponse.json(
      { ok: false, error: "Missing code" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("species")
    .select(
      "code, description_en, form, size, scientific_name"
    )
    .eq("code", code)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: "Species not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    species: data,
  });
}
