// src/lib/finders.ts
import { loadCatalogs } from "@/lib/loadCatalogs";


// -----------------------------------------------------------
//  ENCONTRAR CLIENTE POR CÓDIGO
// -----------------------------------------------------------
export function findClientByCode(code: string) {
  const c = code.trim().toUpperCase();
  const { clients } = loadCatalogs();

  return clients.find(client => client.code.toUpperCase() === c) ?? null;
}


// -----------------------------------------------------------
//  ENCONTRAR ESPECIE / TALLA / FORMATO POR CLAVE (ARS1, BO2…)
// -----------------------------------------------------------
export function findSpeciesByCode(code: string) {
  const c = code.trim().toUpperCase();
  const { speciesCodes, species, sizes, forms } = loadCatalogs();

  // 1) Buscar mapping
  const map = speciesCodes.find(sc => sc.code.toUpperCase() === c);
  if (!map) return null;

  // 2) Resolver relaciones mediante IDs
  const sp = species.find(s => s.id === map.species_id) ?? null;
  const sz = sizes.find(s => s.id === map.size_id) ?? null;
  const fm = forms.find(f => f.id === map.form_id) ?? null;

  // 3) Objeto EXACTO como lo usa el packing
  return {
    code: map.code,
    description_en: sp?.name_en ?? "",
    size: sz?.name ?? "",
    form: fm?.name ?? "",
    scientific_name: sp?.scientific_name ?? "",
  };
}
