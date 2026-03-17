import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const code = body.code?.trim().toUpperCase();
    const description_en = body.name_en?.trim().toUpperCase();
    const scientific_name = body.scientific_name?.trim().toUpperCase();
    const size = body.size?.trim();
    const form = body.form?.trim() || "W&G";

    if (!code || !description_en || !size) {
      return NextResponse.json(
        { error: "code, name_en, size required" },
        { status: 400 }
      );
    }

    // 🔴 1. validar duplicado por código
    const { data: existingCode } = await supabase
      .from("species")
      .select("*")
      .eq("code", code)
      .maybeSingle();

    if (existingCode) {
      return NextResponse.json(
        { error: "Code already exists" },
        { status: 409 }
      );
    }

    // 🔴 2. validar duplicado por especie real
    const { data: existingSpecies } = await supabase
      .from("species")
      .select("*")
      .eq("description_en", description_en)
      .eq("size", size)
      .eq("form", form)
      .maybeSingle();

    if (existingSpecies) {
      return NextResponse.json(
        { error: "Species already exists with different code" },
        { status: 409 }
      );
    }

    // ✅ insertar
    const { data, error } = await supabase
      .from("species")
      .insert({
        code,
        description_en,
        scientific_name,
        size,
        form,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      map: { code: data.code },
      species: data,
      size: { name: data.size },
      form: { name: data.form },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}