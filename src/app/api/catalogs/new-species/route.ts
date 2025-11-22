// src/app/api/catalogs/new-species/route.ts
import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/json-db";

export async function POST(req: Request) {
  const body = await req.json();
  const { code, name_en, size, form, scientific_name } = body || {};
  if (!code || !name_en) {
    return NextResponse.json({ ok:false, error:"code & name_en required" }, { status:400 });
  }

  const [species, sizes, forms, maps] = await Promise.all([
    readJson<any[]>("species.json", []),
    readJson<any[]>("sizes.json", []),
    readJson<any[]>("forms.json", []),
    readJson<any[]>("species_codes.json", []),
  ]);

  // crea o usa size / form por nombre simple
  const getOrCreate = (arr: any[], name: string, key="name") => {
    if (!name) return null;
    let row = arr.find(a => (a[key] ?? "").toUpperCase() === name.toUpperCase());
    if (!row) {
      row = { id: (arr.at(-1)?.id ?? 0) + 1, [key]: name };
      arr.push(row);
    }
    return row.id;
  };

  const spId = (species.at(-1)?.id ?? 0) + 1;
  species.push({ id: spId, name_en, scientific_name });

  const sizeId = getOrCreate(sizes, size);
  const formId = getOrCreate(forms, form);

  maps.push({
    code: code.toUpperCase(),
    species_id: spId,
    size_id: sizeId,
    form_id: formId,
  });

  await Promise.all([
    writeJson("species.json", species),
    writeJson("sizes.json", sizes),
    writeJson("forms.json", forms),
    writeJson("species_codes.json", maps),
  ]);

  return NextResponse.json({ ok:true });
}
