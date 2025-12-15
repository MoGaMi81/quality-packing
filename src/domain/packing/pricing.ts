// src/domain/packing/pricing.ts
import type { PackingLine } from "./types";

// -----------------------------------------------
// Familias que comparten **el mismo precio siempre**
// BG# → Black Grouper
// GG# → Gag Grouper
// SG# → Scamp Grouper
// FB# → Fireback Grouper
// -----------------------------------------------

const PRICE_FAMILIES: Record<string, string> = {
  BG: "BLACK GROUPER",
  GG: "BLACK GROUPER",
  SG: "BLACK GROUPER",
  FB: "BLACK GROUPER",
};

// -----------------------------------------------
// Determina el “grupo de precio” de una línea
// -----------------------------------------------
export function getPriceKey(l: PackingLine): string {
  const code = (l.code ?? "").toUpperCase();

  if (code.length >= 2) {
    const prefix = code.slice(0, 2); // BG, GG, SG, FB

    if (PRICE_FAMILIES[prefix]) {
      // Todas estas familias valen lo mismo sin importar talla
      return PRICE_FAMILIES[prefix];
    }
  }

  // Caso normal → se cobra por especie + talla
  return `${l.description_en}|||${l.size}`;
}

// -----------------------------------------------
// Construir el listado de precios a solicitar
// -----------------------------------------------
export function buildPriceRequest(lines: PackingLine[]) {
  const groups = new Map<
    string,
    {
      label: string;
      codes: Set<string>;
    }
  >();

  for (const l of lines) {
    const key = getPriceKey(l);

    if (!groups.has(key)) {
      groups.set(key, {
        label: key.includes("|||")
          ? `${l.description_en} ${l.size}` // caso normal
          : key,                           // caso familia BG/GG/SG/FB
        codes: new Set(),
      });
    }

    if (l.code) groups.get(key)!.codes.add(l.code);
  }

  return [...groups.entries()].map(([key, g]) => ({
    key,
    label: g.label,
  }));
}

// -----------------------------------------------
// Aplicar precios a todas las líneas
// -----------------------------------------------
export function applyPrices(
  lines: PackingLine[],
  priceMap: Record<string, number>
) {
  return lines.map((l) => {
    const key = getPriceKey(l);
    const price = priceMap[key] || 0;
    const total = l.pounds * price;

    return {
      ...l,
      price,
      total,
    };
  });
}
