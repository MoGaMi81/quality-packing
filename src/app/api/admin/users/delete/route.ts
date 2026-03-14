import { getRoleFromRequest } from "@/lib/role-server";
import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function DELETE(req: Request){

 const role = await getRoleFromRequest();

 if(role !== "admin"){
   return NextResponse.json({ ok:false }, { status:403 });
 }

 const { id } = await req.json();

 const { error } = await supabase
   .from("users")
   .delete()
   .eq("id", id);

 if(error){
   return NextResponse.json({ ok:false, error:error.message });
 }

 return NextResponse.json({ ok:true });
}