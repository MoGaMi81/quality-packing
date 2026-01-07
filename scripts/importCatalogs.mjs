import { readFile, writeFile, mkdir } from "fs/promises";
import { parse } from "csv-parse/sync";
import { randomUUID } from "crypto";
import path from "path";

const ROOT = process.cwd();
const IMPORTS = path.join(ROOT, "imports");
const OUTDIR = path.join(ROOT, "src", "data");

const speciesCsv = path.join(IMPORTS, "species.csv");
const clientsCsv = path.join(IMPORTS, "clients.csv");

function uniqPush(map, key, makeObj) {
  if (!map.has(key)) map.set(key, makeObj());
  return map.get(key);
}

function norm(s) {
  return (s ?? "").toString()?.trim();
}

async function run() {
  await mkdir(OUTDIR, { recursive: true });

  // === SPECIES CSV ===
  const speciesBuf = await readFile(speciesCsv, "utf8");
  const speciesRows = parse(speciesBuf, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  // Maps para deduplicar
  const speciesMap = new Map();   // key: name_en|scientific_name -> {id,...}
  const sizeMap = new Map();      // key: size -> {id,name}
  const formMap = new Map();      // key: form -> {id,name}

  const speciesCodes = [];        // salida species_codes.json

  for (const row of speciesRows) {
    const code = norm(row.code);
    const name_en = norm(row.name_en);
    const size = norm(row.size);
    const form = norm(row.form || "W&G");
    const scientific_name = norm(row.scientific_name);

    if (!code || !name_en) continue;

    const spKey = `${name_en}|${scientific_name}`;
    const sp = uniqPush(speciesMap, spKey, () => ({
      id: randomUUID(),
      code: "",            // opcional; usamos code por-variación abajo
      name_en,
      scientific_name,
      form_default: form || undefined,
    }));

    const sz = uniqPush(sizeMap, size, () => ({ id: randomUUID(), name: size }));
    const fm = uniqPush(formMap, form, () => ({ id: randomUUID(), name: form }));

    speciesCodes.push({
      code,
      species_id: sp.id,
      size_id: sz.id,
      form_id: fm.id,
    });
  }

  const species = [...speciesMap.values()];
  const sizes = [...sizeMap.values()];
  const forms = [...formMap.values()];

  // === CLIENTS CSV ===
  const clientsBuf = await readFile(clientsCsv, "utf8");
  const clientsRows = parse(clientsBuf, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const clients = clientsRows.map((r) => ({
    id: randomUUID(),
    code: norm(r.code),
    name: norm(r.name),
    address: norm(r.address),
    city: norm(r.city),
    state: norm(r.state),
    country: norm(r.country),
    zip: norm(r.zip),
    tax_id: norm(r.tax_id),
    is_active: true,
  })).filter(c => c.code && c.name);

  // === WRITE FILES ===
  const pretty = (x) => JSON.stringify(x, null, 2);

  await writeFile(path.join(OUTDIR, "species.json"), pretty(species), "utf8");
  await writeFile(path.join(OUTDIR, "sizes.json"), pretty(sizes), "utf8");
  await writeFile(path.join(OUTDIR, "forms.json"), pretty(forms), "utf8");
  await writeFile(path.join(OUTDIR, "species_codes.json"), pretty(speciesCodes), "utf8");
  await writeFile(path.join(OUTDIR, "clients.json"), pretty(clients), "utf8");

  console.log(`OK -> ${species.length} species, ${sizes.length} sizes, ${forms.length} forms, ${speciesCodes.length} species_codes, ${clients.length} clients`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
