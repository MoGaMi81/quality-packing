// ======================================
//  IMPORT RAW JSON DESDE /data
// ======================================
import clientsRaw from "@/../data/clients.json";
import speciesRaw from "@/../data/species.json";
import sizesRaw from "@/../data/sizes.json";
import formsRaw from "@/../data/forms.json";
import settingsRaw from "@/../data/settings.json";
import speciesCodesRaw from "@/../data/species_codes.json";

// ======================================
//  IMPORTAR SCHEMAS DE ZOD
// ======================================
import { ClientsSchema, type Clients } from "@/domain/models/cliente";
import { SpeciesSchema, type Species } from "@/domain/models/species";
import { SizeSchema, type Size } from "@/domain/models/size";
import { FormSchema, type FormModel } from "@/domain/models/form";
import { SettingsSchema, type Settings } from "@/domain/models/settings";
import { SpeciesCodeSchema, type SpeciesCode } from "@/domain/models/speciesCode";

// --------------------------------------
// Helpers
// --------------------------------------
function forceArray(v: unknown): any[] {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") return Object.values(v);
  return [];
}

function safe<T>(fn: () => T, label: string, item?: unknown): T {
  try {
    return fn();
  } catch (err) {
    console.error(`❌ Error parsing ${label}:`, item);
    throw err;
  }
}

// ======================================
//  FUNCIÓN PRINCIPAL
// ======================================
export function loadCatalogs() {
  const rawClients = forceArray(clientsRaw);
  const rawSpecies = forceArray(speciesRaw);
  const rawSizes = forceArray(sizesRaw);
  const rawForms = forceArray(formsRaw);
  const rawSpeciesCodes = forceArray(speciesCodesRaw);

  // Validar cada elemento con su esquema Zod
  const clients: Clients[] = rawClients
    .filter((c: any) => c?.code && c?.name)
    .map((c) => safe(() => ClientsSchema.parse(c), "client", c));

  const species: Species[] = rawSpecies.map((s) =>
    safe(() => SpeciesSchema.parse(s), "species", s)
  );

  const sizes: Size[] = rawSizes.map((s) =>
    safe(() => SizeSchema.parse(s), "size", s)
  );

  const forms: FormModel[] = rawForms.map((f) =>
    safe(() => FormSchema.parse(f), "form", f)
  );

  const speciesCodes: SpeciesCode[] = rawSpeciesCodes
    .filter((sc: any) => sc?.code)
    .map((sc) => safe(() => SpeciesCodeSchema.parse(sc), "species_code", sc));

  const settings: Settings = safe(
    () => SettingsSchema.parse(settingsRaw),
    "settings.json"
  );

  return {
    clients,
    species,
    sizes,
    forms,
    settings,
    speciesCodes,
  };
}

// ======================================
// TIPO EXPORTADO
// ======================================
export type Catalogs = ReturnType<typeof loadCatalogs>;

