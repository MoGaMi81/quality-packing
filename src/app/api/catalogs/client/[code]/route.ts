// src/app/api/catalogs/client/[code]/route.ts
import { NextResponse } from "next/server";
import clients from "@/../data/clients.json";

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
  req: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code.toUpperCase();
  const client = clients.find((c) => c.code.toUpperCase() === code);

  if (!client) {
    return NextResponse.json(
      { error: "Client not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(client);
}

