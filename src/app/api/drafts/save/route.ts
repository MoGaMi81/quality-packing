import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, data } = body;

    if (!id || !data) {
      return NextResponse.json(
        { error: "Missing id or data" },
        { status: 400 }
      );
    }

    // Guarda o actualiza el draft
    const { error } = await supabase
      .from("drafts")
      .upsert({
        id,
        data,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}
