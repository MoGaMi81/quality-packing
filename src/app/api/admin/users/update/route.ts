import { getRoleFromRequest } from "@/lib/role-server";
import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {

 const role = await getRoleFromRequest();

 if (role !== "admin") {
   return NextResponse.json({ ok:false }, { status:403 });
 }

 const { id, role:newRole, active } = await req.json();

 const { error } = await supabase
   .from("users")
   .update({
     role: newRole,
     active
   })
   .eq("id", id);

 if (error) {
   return NextResponse.json({ ok:false, error:error.message });
 }

 return NextResponse.json({ ok:true });
}