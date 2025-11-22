import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/json-db";

type SaveBody = {
  status: "draft" | "final";
  packing: {
    invoice_no: string;
    header: any;                // PackingHeader
    lines: any[];               // PackingLine[]
    created_at?: string;
  };
};

export async function POST(req: Request) {
  const body = (await req.json()) as SaveBody;
  const store = await readJson<any[]>("packings.json", []);
  const exists = store.find((p) => String(p.packing?.invoice_no).toUpperCase() === body.packing.invoice_no.toUpperCase());
  if (exists && body.status === "final") {
    return NextResponse.json({ error: "Invoice already exists" }, { status: 409 });
  }

  const payload = {
    ...body,
    packing: {
      ...body.packing,
      created_at: body.packing.created_at ?? new Date().toISOString(),
    },
  };

  if (exists) {
    // actualizar el borrador existente
    exists.status = body.status;
    exists.packing = payload.packing;
  } else {
    store.push(payload);
  }

  await writeJson("packings.json", store);
  return NextResponse.json({ ok: true });
}
