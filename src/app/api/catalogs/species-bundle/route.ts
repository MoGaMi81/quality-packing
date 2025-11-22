import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readJson, writeJson } from "@/lib/json-db";
import type { NewSpeciesBundleInput } from "@/domain/models/newInputs";

const norm = (s?: string) => (s ?? "").trim();
const up = (s?: string) => norm(s).toUpperCase();

export async function POST(req: Request) {
  const body = (await req.json()) as NewSpeciesBundleInput;

  const code = up(body.code);
  const name_en = norm(body.name_en);
  const scientific_name = norm(body.scientific_name);
  const sizeName = norm(body.size);
  const formName = norm(body.form) || "W&G";

  if (!code || !name_en || !sizeName) {
    return NextResponse.json({ error: "code, name_en and size are required" }, { status: 400 });
  }

  const species = await readJson<any[]>("species.json", []);
  const sizes = await readJson<any[]>("sizes.json", []);
  const forms = await readJson<any[]>("forms.json", []);
  const speciesCodes = await readJson<any[]>("species_codes.json", []);

  if (speciesCodes.find((x) => up(x.code) === code)) {
    return NextResponse.json({ error: "Species code already exists" }, { status: 409 });
  }

  // find-or-create species (name_en + scientific_name)
  const spKey = (s: any) => `${up(s.name_en)}|${up(s.scientific_name)}`;
  let sp = species.find((s) => spKey(s) === `${up(name_en)}|${up(scientific_name)}`);
  if (!sp) {
    sp = { id: randomUUID(), name_en, scientific_name, form_default: formName };
    species.push(sp);
  }

  // find-or-create size
  let sz = sizes.find((s) => up(s.name) === up(sizeName));
  if (!sz) {
    sz = { id: randomUUID(), name: sizeName };
    sizes.push(sz);
  }

  // find-or-create form
  let fm = forms.find((f) => up(f.name) === up(formName));
  if (!fm) {
    fm = { id: randomUUID(), name: formName };
    forms.push(fm);
  }

  // mapping para la clave operativa
  const map = { code, species_id: sp.id, size_id: sz.id, form_id: fm.id };
  speciesCodes.push(map);

  await Promise.all([
    writeJson("species.json", species),
    writeJson("sizes.json", sizes),
    writeJson("forms.json", forms),
    writeJson("species_codes.json", speciesCodes),
  ]);

  // 👉 Respuesta “public” (sin ids). La clave viaja solo para autocompletar, no para impresión.
  return NextResponse.json(
    {
      ok: true,
      map: { code },
      species: { name_en: sp.name_en, scientific_name: sp.scientific_name },
      size: { name: sz.name },
      form: { name: fm.name },
    },
    { status: 201 }
  );
}
