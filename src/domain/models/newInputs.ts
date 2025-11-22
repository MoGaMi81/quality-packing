export type NewClientInput = {
  code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  tax_id?: string;
};

export type NewSpeciesBundleInput = {
  // la clave operativa que usarás en captura (ej. ARS1-22)
  code: string;

  // especie biológica
  name_en: string;
  scientific_name?: string;

  // catálogo auxiliares
  size: string;     // ej. "1-2", "10-20", "40UP"
  form: string;     // ej. "W&G"
};
