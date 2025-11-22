
// src/domain/packing/types.ts
export type PackingLine = {
  box_no: number;            // consecutivo visible
  description_en: string;
  form: string;
  size: string;
  pounds: number;            // entero
  combined_with?: number;    // para cajas combinadas (se usa en Paso 3)
};

export type PackingHeader = {
  client_code: string;
  client_name: string;
  address?: string;
  tax_id?: string;
  guide?: string;
  invoice_no?: string;
  date?: string;             // ISO yyyy-mm-dd
};
