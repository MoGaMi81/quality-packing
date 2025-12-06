import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { client_code } = await req.json();

    if (!client_code?.trim()) {
      return NextResponse.json({ error: "Client code required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("packing_drafts")
      .insert({
        client_code: client_code.trim().toUpperCase(),
        status: "draft"
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });

  } catch (e) {
    console.error("NEW DRAFT ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
