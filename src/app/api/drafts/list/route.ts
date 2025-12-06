import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("packing_drafts")
      .select("*")
      .eq("status", "draft")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, drafts: data });

  } catch (e) {
    console.error("LIST DRAFTS ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
