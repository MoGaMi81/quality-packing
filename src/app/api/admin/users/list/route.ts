import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRoleFromRequest } from "@/lib/role-server";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {

  const role = await getRoleFromRequest();

  if (role !== "admin") {
    return NextResponse.json(
      { ok:false, error:"No autorizado" },
      { status:403 }
    );
  }

  const { data, error } = await supabase
    .from("users")
    .select("id,email,name,role,active")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { ok:false, error:error.message },
      { status:500 }
    );
  }

  return NextResponse.json({
    ok:true,
    users:data ?? []
  });
}