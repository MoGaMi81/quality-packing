import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { client_code, draft_name } = await req.json();

  if (!client_code || !draft_name) {
    return NextResponse.json(
      { error: "client_code y draft_name son obligatorios" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("drafts")
    .insert({
      client_code,
      draft_name,
      header: {}, // empieza vacío
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, draft: data });
}

