
// src/domain/packing/types.ts
// =====================================
// PACKING TYPES (BASE MODULE)
// =====================================

export type PackingLine = {
  box_no: number;            // número de caja
  description_en: string;    // nombre comercial EN
  form: string;              // presentación (W&G, Fillet…)
  size: string;              // calibre (1-2, 3/4-1…)
  pounds: number;            // peso en libras
  combined_with?: number;    // si es combinada, ID de la caja
};

export type PackingHeader = {
  client_code: string;
  client_name: string;
  address?: string;
  tax_id?: string;
  guide?: string;
  invoice_no?: string;
  date?: string;             // ISO (yyyy-mm-dd)
};

// =====================================
// INVOICE LINE (EXPORTACIÓN / FACTURA)
// =====================================

export type InvoiceLine = {
  amount: string;
  price: string;
  boxes: number;
  pounds: number;
  description_en: string;
  size: string;
  form: string;
  scientific_name?: string;
};

// =====================================
// SPECIES GROUP (PRICING MODAL)
// =====================================
// Agrupa especies por description_en + form + size

export type SpeciesGroup = {
  key: string;               // description||form||size
  description_en: string;
  form: string;
  size: string;
  boxes: number;             // total de cajas con esa especie
  pounds: number;            // total de lbs de esa especie
};

// =====================================
// PRICING LINE (TABLA FINAL)
// =====================================

export type PricingLine = {
  box_no: number;
  description_en: string;
  form: string;
  size: string;
  pounds: number;

  price: number;             // USD/lb
  total: number;             // pounds * price

  key: string;               // description||form||size
};

// =====================================
// PRICING MODAL PROPS
// =====================================

export type PricingModalProps = {
  open: boolean;
  species: SpeciesGroup[];
  onClose: () => void;
  onSave: (priceMap: Record<string, number>) => void;
};
