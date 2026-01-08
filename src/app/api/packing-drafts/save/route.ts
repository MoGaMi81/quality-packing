import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("BODY RECIBIDO:", body);

    return NextResponse.json({
      ok: true,
      debug: body,
    });
  } catch (e: any) {
    console.error("ERROR SAVE DRAFT:", e);

    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
