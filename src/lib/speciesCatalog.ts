// src/lib/speciesCatalog.ts
let speciesBundle: any[] | null = null;

export async function loadSpeciesBundle() {
  if (speciesBundle) return speciesBundle;

  const r = await fetch("/api/catalogs/species-bundle");
  speciesBundle = await r.json();
  return speciesBundle;
}

export function findSpeciesCode(line: {
  description_en: string;
  form: string;
  size: string;
}) {
  if (!speciesBundle) return null;

  const found = speciesBundle.find(
    (sp) =>
      sp.description_en === line.description_en &&
      sp.form === line.form &&
      sp.size === line.size
  );

  return found?.code ?? null;
}
