// ===============================================
//  PRICING ENGINE — Sistema de precios unificados
//  Quality Packing
// ===============================================

import type { PackingLine } from "./types";

// ----------------------------------------------------------
// 1. Tabla de prefijos unificados (BG / GG / FB / SG)
//    Todos comparten el precio del grupo “BLACK GROUPER FRESH”
// ----------------------------------------------------------
const GROUPER_PREFIXES = ["BG", "GG", "FB", "SG"];

export function unifyGroupKey(code: string | null | undefined): string {
  if (!code) return "";

  const up = code.toUpperCase();
  const prefix = up.slice(0, 2);

  if (GROUPER_PREFIXES.includes(prefix)) {
    return "BLACK GROUPER FRESH"; // ← clave unificada para pedir precio
  }

  return ""; // otros no se agrupan por grupo, sino por talla completa
}

// ----------------------------------------------------------
// 2. Extraer especies únicas a las que se les debe pedir precio
//
//    Regla:
//    - BG/GG/FB/SG → solo 1 entrada: “BLACK GROUPER FRESH”
//    - Todas las demás → price key = description + size + form
// ----------------------------------------------------------
export type PricingRequest = {
  key: string;              // identificador único
  display: string;          // texto mostrado en modal
  codes: Set<string>;       // todas las claves involucradas
};

export function extractPricingSpecies(lines: PackingLine[]): PricingRequest[] {
  const map = new Map<string, PricingRequest>();

  for (const l of lines) {
    const code = l.code ?? "";
    const unified = unifyGroupKey(code);

    let priceKey = "";
    let displayName = "";

    if (unified) {
      // GRUPO GROPER → piden precio solo 1 vez
      priceKey = unified;                         // ej. "BLACK GROUPER FRESH"
      displayName = unified;
    } else {
      // TALLA ESPECÍFICA → precio individual
      priceKey = `${l.description_en}|||${l.size}|||${l.form}`;
      displayName = `${l.description_en} ${l.size}`;
    }

    if (!map.has(priceKey)) {
      map.set(priceKey, {
        key: priceKey,
        display: displayName,
        codes: new Set(),
      });
    }

    map.get(priceKey)!.codes.add(code);
  }

  return [...map.values()];
}

// ----------------------------------------------------------
// 3. Aplicar precios a todas las líneas del packing
//    input:
//      - lines: packing original
//      - prices: diccionario { priceKey → precio numérico }
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
  const result: PricedLine[] = [];

  for (const l of lines) {
    const code = l.code ?? "";
    const unified = unifyGroupKey(code);

    let priceKey = "";

    if (unified) {
      priceKey = unified; // usa precio grupal
    } else {
      priceKey = `${l.description_en}|||${l.size}|||${l.form}`;
    }

    const price = prices[priceKey] ?? 0;
    const total = price * l.pounds;

    result.push({
      ...l,
      price,
      total,
      priceKey,
    });
  }

  return result;
}

