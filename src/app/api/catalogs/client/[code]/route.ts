// src/app/api/catalogs/client/[code]/route.ts
import { NextResponse } from "next/server";
import { readJson } from "@/lib/json-db";

type RawClient = {
  code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  tax_id?: string;
};

export async function GET(
  _req: Request,
  ctx: { params: { code: string } }
) {
  const code = (ctx.params.code ?? "").toUpperCase().trim();
  if (!code) {
    return NextResponse.json(
      { error: "Missing code" },
      { status: 400 }
    );
  }

  const clients = await readJson<RawClient[]>("clients.json", []);
  const found = clients.find(
    (c) => (c.code ?? "").toUpperCase() === code
  );

  if (!found) {
    return NextResponse.json(
      { error: "Client not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(found);
}

