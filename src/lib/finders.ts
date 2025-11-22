import { loadCatalogs } from "@/lib/loadCatalogs";

export function findClientByCode(code: string) {
  const c = code.trim().toUpperCase();
  const { clients } = loadCatalogs();
  return clients.find(x => x.code.toUpperCase() === c) ?? null;
}

/** Devuelve el mapping de la clave y los catálogos relacionados si existe */
export function findSpeciesByCode(code: string) {
  const c = code.trim().toUpperCase();
  const { speciesCodes, species, sizes, forms } = loadCatalogs();
  const map = speciesCodes.find(x => x.code.toUpperCase() === c);
  if (!map) return null;

  const sp = species.find(s => s.id === map.species_id) ?? null;
  const sz = sizes.find(s => s.id === map.size_id) ?? null;
  const fm = forms.find(f => f.id === map.form_id) ?? null;

  // 👉 sin ids
  return {
    code: map.code,                     // solo para autocompletar; no imprimir
    description_en: sp?.name_en ?? "",
    size: sz?.name ?? "",
    form: fm?.name ?? "",
    scientific_name: sp?.scientific_name ?? "",
  };
}