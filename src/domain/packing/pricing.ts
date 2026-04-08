// ===============================================
//  PRICING ENGINE — Sistema de precios unificados
//  Quality Packing (FINAL)
// ===============================================

import type { PackingLine } from "./types";

// ----------------------------------------------------------
// 1. Detectar GROUPER W&G REAL (sin depender de code)
// ----------------------------------------------------------
function isGrouperWG(l: PackingLine): boolean {
  if (l.form !== "W&G") return false;

  const desc = l.description_en?.toUpperCase() || "";

  // ❌ excluir fillet
  if (desc.includes("FILLET")) return false;

  // ✅ SOLO estas 4 especies
  return (
    desc.includes("BLACK GROUPER") ||
    desc.includes("SCAMP GROUPER") ||
    desc.includes("FIREBACK GROUPER") ||
    desc.includes("GAG GROUPER")
  );
}

// ----------------------------------------------------------
// 2. Extraer especies únicas a las que se les debe pedir precio
//
//    Reglas:
//    - GROUPER W&G → UNA SOLA entrada: "GROUPER_WG"
//    - Resto → description + form + size
// ----------------------------------------------------------
export type PricingRequest = {
  key: string;        // identificador único
  display: string;    // texto mostrado en modal
};

export function extractPricingSpecies(
  lines: PackingLine[]
): PricingRequest[] {
  const map = new Map<string, PricingRequest>();

  for (const l of lines) {
    let key: string;
    let display: string;

    if (isGrouperWG(l)) {
      key = "GROUPER_WG";
      display = "GROUPER W&G (BG)";
    } else {
      key = `${l.description_en}|||${l.form}|||${l.size}`;
      display = `${l.description_en} ${l.form} ${l.size}`;
    }

    if (!map.has(key)) {
      map.set(key, { key, display });
    }
  }

  return Array.from(map.values());
}

// ----------------------------------------------------------
// 3. Aplicar precios a todas las líneas del packing
// ----------------------------------------------------------
export type PricedLine = PackingLine & {
  price: number;
  total: number;
  priceKey: string;
};

export function applyPricing(
  lines: PackingLine[],
  prices: Record<string, number>
): PricedLine[] {
  return lines.map((l) => {
    const priceKey = isGrouperWG(l)
      ? "GROUPER_WG"
      : `${l.description_en}|||${l.form}|||${l.size}`;

    const price = prices[priceKey];

    if (!Number.isFinite(price)) {
      throw new Error(
        `Falta precio válido para ${l.description_en} ${l.form} ${l.size}`
      );
    }

    const pounds = l.pounds ?? 0;

    return {
      ...l,
      price,
      total: price * pounds,
      priceKey,
    };
  });
}
