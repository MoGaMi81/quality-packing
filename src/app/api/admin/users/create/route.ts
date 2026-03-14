import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireRole } from "@/lib/requireRole";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {

  requireRole(req, ["admin"]);

  const { email, password, name, role } = await req.json();

  if (!email || !password || !role) {
    return NextResponse.json(
      { ok: false, error: "Datos incompletos" },
      { status: 400 }
    );
  }

  /* crear usuario en auth */

  const { data: authUser, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError) {
    return NextResponse.json(
      { ok: false, error: authError.message },
      { status: 500 }
    );
  }

  /* guardar en tabla users */

  const { error: insertError } = await supabase
    .from("users")
    .insert({
      id: authUser.user.id,
      email,
      name,
      role,
    });

  if (insertError) {
    return NextResponse.json(
      { ok: false, error: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}