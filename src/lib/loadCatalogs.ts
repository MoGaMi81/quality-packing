// ======================================
// 1) IMPORTAR RAW JSON DESDE /data
// ======================================
import clientsRaw from "@/../data/clients.json";
import speciesRaw from "@/../data/species.json";
import sizesRaw from "@/../data/sizes.json";
import formsRaw from "@/../data/forms.json";
import settingsRaw from "@/../data/settings.json";
import speciesCodesRaw from "@/../data/species_codes.json";

// ======================================
// 2) IMPORTAR SCHEMAS / TIPOS
// ======================================
import { ClientsSchema, type Clients } from "@/domain/models/cliente";
import { SpeciesSchema, type Species } from "@/domain/models/species";
import { SizeSchema, type Size } from "@/domain/models/size";
import { FormSchema, type FormModel } from "@/domain/models/form";
import { SettingsSchema, type Settings } from "@/domain/models/settings";
import { SpeciesCodeSchema, type SpeciesCode } from "@/domain/models/speciesCode";

// ======================================
// 3) VALIDAR JSONs con Zod
// ======================================
export const clients = ClientsSchema.parse(clientsRaw);
export const species = SpeciesSchema.parse(speciesRaw);
export const sizes = SizeSchema.parse(sizesRaw);
export const forms = FormSchema.parse(formsRaw);
export const settings = SettingsSchema.parse(settingsRaw);
export const speciesCodes = SpeciesCodeSchema.parse(speciesCodesRaw);

// ======================================
// 4) EXPORTAR TODO JUNTO
// ======================================
export const catalogs = {
  clients,
  species,
  sizes,
  forms,
  settings,
  speciesCodes,
};

export type Catalogs = typeof catalogs;
