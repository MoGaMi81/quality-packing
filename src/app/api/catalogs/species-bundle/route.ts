import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/json-db";
import type { NewSpeciesBundleInput } from "@/domain/models/newInputs";

const norm = (s?: string) => (s ?? "").trim();
const up = (s?: string) => norm(s).toUpperCase();

// ======================================================
//  ✔ GET — Devuelve todo el catálogo resolviendo claves
// ======================================================
export async function GET() {
  const speciesCodes = await readJson<any[]>("species_codes.json", []);
  const species = await readJson<any[]>("species.json", []);
  const sizes = await readJson<any[]>("sizes.json", []);
  const forms = await readJson<any[]>("forms.json", []);

  const bundle = speciesCodes.map((row) => {
    const sp = species.find((s) => s.id === row.species_id);
    const sz = sizes.find((s) => s.id === row.size_id);
    const fm = forms.find((f) => f.id === row.form_id);

    return {
      code: row.code,
      name_en: sp?.name_en ?? "",
      scientific_name: sp?.scientific_name ?? "",
      size: sz?.name ?? "",
      form: fm?.name ?? "",
    };
  });

  return NextResponse.json(bundle);
}

// ======================================================
//  ✔ POST — Registrar nueva clave + especie + tamaño + form
// ======================================================
export async function POST(req: Request) {
  const body = (await req.json()) as NewSpeciesBundleInput;

  const code = up(body.code);
  const name_en = norm(body.name_en);
  const scientific_name = norm(body.scientific_name);
  const sizeName = norm(body.size);
  const formName = norm(body.form) || "W&G";

  if (!code || !name_en || !sizeName) {
    return NextResponse.json(
      { error: "code, name_en and size are required" },
      { status: 400 }
    );
  }

  const species = await readJson<any[]>("species.json", []);
  const sizes = await readJson<any[]>("sizes.json", []);
  const forms = await readJson<any[]>("forms.json", []);
  const speciesCodes = await readJson<any[]>("species_codes.json", []);

  // evitar duplicación de clave
  if (speciesCodes.find((x) => up(x.code) === code)) {
    return NextResponse.json(
      { error: "Species code already exists" },
      { status: 409 }
    );
  }

  // crear o reusar especie
  const spKey = (s: any) =>
    `${up(s.name_en)}|${up(s.scientific_name)}`;
  let sp = species.find(
    (s) => spKey(s) === `${up(name_en)}|${up(scientific_name)}`
  );

  if (!sp) {
    sp = {
      id: randomUUID(),
      name_en,
      scientific_name,
      form_default: formName,
    };
    species.push(sp);
  }

  // crear o reusar size
  let sz = sizes.find((s) => up(s.name) === up(sizeName));
  if (!sz) {
    sz = { id: randomUUID(), name: sizeName };
    sizes.push(sz);
  }

  // crear o reusar form
  let fm = forms.find((f) => up(f.name) === up(formName));
  if (!fm) {
    fm = { id: randomUUID(), name: formName };
    forms.push(fm);
  }

  // guardar mapping code → ids
  const map = { code, species_id: sp.id, size_id: sz.id, form_id: fm.id };
  speciesCodes.push(map);

  await Promise.all([
    writeJson("species.json", species),
    writeJson("sizes.json", sizes),
    writeJson("forms.json", forms),
    writeJson("species_codes.json", speciesCodes),
  ]);

  return NextResponse.json(
    {
      ok: true,
      map: { code },
      species: {
        name_en: sp.name_en,
        scientific_name: sp.scientific_name,
      },
      size: { name: sz.name },
      form: { name: fm.name },
    },
    { status: 201 }
  );
}

