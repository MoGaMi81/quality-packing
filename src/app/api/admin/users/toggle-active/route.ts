import { supabase } from "@/lib/supabaseClient"
import { NextResponse } from "next/server"

export async function PATCH(req:Request){

 const {id, active} = await req.json()

 const {error} = await supabase
   .from("users")
   .update({active})
   .eq("id",id)

 if(error){
  return NextResponse.json({ok:false,error:error.message})
 }

 return NextResponse.json({ok:true})
}