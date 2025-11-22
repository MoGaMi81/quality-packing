// src/app/api/catalogs/debug/species-codes/route.ts
import { NextResponse } from "next/server";
import { readJson } from "@/lib/json-db";

export async function GET() {
  const speciesCodes = await readJson<any[]>("species_codes.json", []);
  return NextResponse.json({
    count: speciesCodes.length,
    sample: speciesCodes.slice(0, 10).map(x => x.code),
  });
}