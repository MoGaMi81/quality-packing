import clientsRaw from "@/data/clients.json";
import speciesRaw from "@/data/species.json";
import sizesRaw from "@/data/sizes.json";
import formsRaw from "@/data/forms.json";
import settingsRaw from "@/data/settings.json";
import speciesCodesRaw from "@/data/species_codes.json";

import { ClientsSchema, type Clients } from "@/domain/models/cliente";
import { SpeciesSchema, type Species } from "@/domain/models/species";
import { SizeSchema, type Size } from "@/domain/models/size";
import { FormSchema, type FormModel } from "@/domain/models/form";
import { SettingsSchema, type Settings } from "@/domain/models/settings";
import { SpeciesCodeSchema, type SpeciesCode } from "@/domain/models/speciesCode";

type Catalogs = {
  clients: Clients[];
  species: Species[];
  sizes: Size[];
  forms: FormModel[];
  settings: Settings;
  speciesCodes: SpeciesCode[];
};

function asArray(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? v : [];
}

function must<T>(fn: () => T, label: string, obj?: unknown): T {
  try {
    return fn();
  } catch (e) {
    console.error(`❌ Zod error while parsing ${label}:`, obj);
    throw e;
  }
}

export function loadCatalogs(): Catalogs {
  const clientsArr = asArray(clientsRaw)
    // evita líneas sin clave o sin nombre
    .filter((c: any) => (c?.code ?? "").toString().trim() && (c?.name ?? "").toString().trim());

  const speciesArr = asArray(speciesRaw);
  const sizesArr = asArray(sizesRaw);
  const formsArr = asArray(formsRaw);

  const speciesCodesArr = asArray(speciesCodesRaw)
    // evita claves vacías en species_codes
    .filter((sc: any) => (sc?.code ?? "").toString().trim());

  const parsedClients: Clients[] = clientsArr.map((c) =>
    must(() => ClientsSchema.parse(c), "clients.json item", c)
  );

  const parsedSpecies: Species[] = speciesArr.map((s) =>
    must(() => SpeciesSchema.parse(s), "species.json item", s)
  );

  const parsedSizes: Size[] = sizesArr.map((s) =>
    must(() => SizeSchema.parse(s), "sizes.json item", s)
  );

  const parsedForms: FormModel[] = formsArr.map((f) =>
    must(() => FormSchema.parse(f), "forms.json item", f)
  );

  const parsedSettings: Settings = must(
    () => SettingsSchema.parse((settingsRaw ?? {}) as unknown),
    "settings.json"
  );

  const parsedSpeciesCodes: SpeciesCode[] = speciesCodesArr.map((sc) =>
    must(() => SpeciesCodeSchema.parse(sc), "species_codes.json item", sc)
  );

  return {
    clients: parsedClients,
    species: parsedSpecies,
    sizes: parsedSizes,
    forms: parsedForms,
    settings: parsedSettings,
    speciesCodes: parsedSpeciesCodes,
  };
}
