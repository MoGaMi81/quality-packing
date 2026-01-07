// src/app/api/catalogs/species-by-code/[code]/route.ts
import { NextResponse } from "next/server";
import { readJson } from "@/lib/json-db";

type Species = {
  id: string;
  name_en: string;
  scientific_name?: string;
  form_default?: string;
};

type Size = {
  id: string;
  name: string;
};

type Form = {
  id: string;
  name: string;
};

type MapRow = {
  code: string;
  species_id: string;
  size_id: string;
  form_id: string;
};

export async function GET(
  _req: Request,
  ctx: { params: { code: string } }
) {
  const code = (ctx.params.code ?? "").toUpperCase()?.trim();
  if (!code) {
    return NextResponse.json(
      { error: "Missing code" },
      { status: 400 }
    );
  }

  const [maps, species, sizes, forms] = await Promise.all([
    readJson<MapRow[]>("species_codes.json", []),
    readJson<Species[]>("species.json", []),
    readJson<Size[]>("sizes.json", []),
    readJson<Form[]>("forms.json", []),
  ]);

  const m = maps.find(
    (x) => (x.code ?? "").toUpperCase() === code
  );
  if (!m) {
    return NextResponse.json(
      { error: "Species code not found" },
      { status: 404 }
    );
  }

  const sp = species.find((s) => s.id === m.species_id);
  const sz = sizes.find((s) => s.id === m.size_id);
  const fm = forms.find((f) => f.id === m.form_id);

  if (!sp || !sz || !fm) {
    return NextResponse.json(
      { error: "Broken mapping" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    map: m,
    species: sp,
    size: sz,
    form: fm,
  });
}
