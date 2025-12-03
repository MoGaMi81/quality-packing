import { catalogs } from "@/lib/loadCatalogs";
const { clients } = catalogs;
export function findClientByCode(code: string) {
  const c = code.trim().toUpperCase();
  const { clients } = catalogs;

  return clients.find(x => x.code.toUpperCase() === c) ?? null;
}

export function findSpeciesByCode(code: string) {
  const c = code.trim().toUpperCase();
  const { speciesCodes, species, sizes, forms } = catalogs;

  const map = speciesCodes.find(x => x.code.toUpperCase() === c);
  if (!map) return null;

  const sp = species.find(s => s.id === map.species_id) ?? null;
  const sz = sizes.find(s => s.id === map.size_id) ?? null;
  const fm = forms.find(f => f.id === map.form_id) ?? null;

  return {
    code: map.code,
    description_en: sp?.name_en ?? "",
    size: sz?.name ?? "",
    form: fm?.name ?? "",
    scientific_name: sp?.scientific_name ?? "",
  };
}
