import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function GET() {
  const { data } = await supabase
    .from("packings")
    .select("invoice_no")
    .order("invoice_no", { ascending: false })
    .limit(1);

  const last = data?.[0]?.invoice_no || "0";
  const next = generateNextInvoice(last);

  return NextResponse.json({ next });
}

function generateNextInvoice(last: any) {
    throw new Error("Function not implemented.");
}
