import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // asegúrate que este archivo exista

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const client = await prisma.client.create({
      data: {
        code: body.code,
        name: body.name,
        address: body.address || "",
        city: body.city || "",
        state: body.state || "",
        country: body.country || "",
        zip: body.zip || "",
        tax_id: body.tax_id || "",
      },
    });

    return NextResponse.json({ ok: true, client });
  } catch (err: any) {
    console.error("Error creating client:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
