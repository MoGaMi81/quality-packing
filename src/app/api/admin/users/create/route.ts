import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRoleFromRequest } from "@/lib/role-server";
import bcrypt from "bcryptjs"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {

  const role = await getRoleFromRequest();

  if (role !== "admin") {
    return NextResponse.json(
      { ok:false, error:"No autorizado" },
      { status:403 }
    );
  }

  const { email, password, name, role: userRole } = await req.json();
  const hash = await bcrypt.hash(password,10)

  const { error } = await supabase
    .from("users")
    .insert({
      email: email.toLowerCase(),
      password: hash,
      name,
      role: userRole,
      active: true
    });

  if (error) {
    return NextResponse.json(
      { ok:false, error:error.message },
      { status:500 }
    );
  }

  return NextResponse.json({ ok:true });
}