// ============================================================
//  PRICING ENGINE — Quality Packing
//  Lógica central para precios, familias, MX y totales
// ============================================================

import type { PackingLine } from "./types";

// ============================================================
//  CONFIGURACIÓN DE FAMILIAS DE PRECIO UNIFICADO
// ============================================================

// Todas estas claves (prefijos) pertenecen a "BLACK GROUPER FRESH"
const FAMILY_BLACK_GROUPER = ["BG", "GG", "SG", "FB"];

// Nombre EXACTO como aparece en species.json
export const BLACK_GROUPER_NAME = "BLACK GROUPER FRESH";

export function detectFamily(code: string | null | undefined): string | null {
  if (!code) return null;

  const prefix = code.substring(0, 2).toUpperCase();

  if (FAMILY_BLACK_GROUPER.includes(prefix)) {
    return BLACK_GROUPER_NAME; // 1 solo precio para BG/GG/SG/FB
  }

  return null; // otras especies se manejan por talla
}

// ============================================================
//  CAJAS COMBINADAS (MIXED BOXES)
//  Regla: 1 línea numérica + varias MX
// ============================================================
export function detectMixedGroups(lines: PackingLine[]) {
  const groups: PackingLine[][] = [];
  let current: PackingLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];

    const isNumber = typeof l.box_no === "number";
    const isMX = l.box_no === "MX";

    if (isNumber) {
      if (current.length) groups.push(current);
      current = [l];
      continue;
    }

    if (isMX) {
      current.push(l);
      continue;
    }
  }

  if (current.length) groups.push(current);

  // Solo caixas combinadas reales (más de 1 línea)
  return groups.filter((g) => g.length > 1);
}

// ============================================================
//  DETECCIÓN DE RANGOS (packing, excepto Sea Lion)
//  Regla:
//   - consecutivas
//   - misma especie, talla, form, pounds
//   - NO participa MX
// ============================================================
function toNumberBox(x: number | "MX"): number | null {
  return typeof x === "number" ? x : null;
}

export function detectPackingRanges(lines: PackingLine[]) {
  const ranges: { start: number; end: number; items: PackingLine[] }[] = [];

  let start = 0;

  while (start < lines.length) {
    const base = lines[start];

    // No rangos si es MX o combinada
    if (typeof base.box_no !== "number") {
      start++;
      continue;
    }

    let end = start;

    while (true) {
      const next = lines[end + 1];
      if (!next) break;

      const b1 = toNumberBox(lines[end].box_no);
      const b2 = toNumberBox(next.box_no);

      if (b1 === null || b2 === null) break; // MX no participa
      if (b2 !== b1 + 1) break; // debe ser consecutiva

      // misma especie exacta
      if (
        next.description_en !== base.description_en ||
        next.form !== base.form ||
        next.size !== base.size ||
        next.pounds !== base.pounds
      ) break;

      end++;
    }

    if (end > start) {
      ranges.push({
        start: lines[start].box_no as number,
        end: lines[end].box_no as number,
        items: lines.slice(start, end + 1),
      });
      start = end + 1;
    } else {
      start++;
    }
  }

  return ranges;
}

// ============================================================
//  AGRUPAR ESPECIES PARA PEDIR PRECIOS
//  Regla:
//   - BG/GG/SG/FB → un solo input: BLACK GROUPER FRESH
//   - otras especies → agrupadas por: description_en + size + form
// ============================================================
export function groupSpeciesForPricing(lines: PackingLine[]) {
  const groups = new Map<
    string,
    { name: string; size: string; form: string; codes: Set<string> }
  >();

  for (const l of lines) {
    const family = detectFamily(l.code);

    if (family) {
      // Todas las tallas → un solo grupo
      const key = `FAMILY_BLACK_GROUPER`;
      if (!groups.has(key)) {
        groups.set(key, {
          name: BLACK_GROUPER_NAME,
          size: "", // no se pide talla
          form: "", // irrelevante para familias
          codes: new Set(),
        });
      }
      groups.get(key)!.codes.add(l.code!);
      continue;
    }

    // Especies normales → un input por talla
    const key = `${l.description_en}|||${l.size}|||${l.form}`;
    if (!groups.has(key)) {
      groups.set(key, {
        name: l.description_en,
        size: l.size,
        form: l.form,
        codes: new Set(),
      });
    }
    groups.get(key)!.codes.add(l.code!);
  }

  return [...groups.values()];
}

// ============================================================
//  APLICAR PRECIOS A LAS LÍNEAS DEL PACKING
//  Recibe:
//    lines: PackingLine[]
//    priceMap: { [name_or_key]: number }
// ============================================================
export function applyPricing(
  lines: PackingLine[],
  priceMap: Record<string, number>
) {
  return lines.map((l) => {
    const family = detectFamily(l.code);

    let price = 0;

    if (family && priceMap[family] != null) {
      // precio unificado
      price = priceMap[family];
    } else {
      // precio normal por (description+size+form)
      const key = `${l.description_en}|||${l.size}|||${l.form}`;
      price = priceMap[key] ?? 0;
    }

    const total = +(l.pounds * price).toFixed(2);

    return {
      ...l,
      price,
      total,
    };
  });
}

// ============================================================
//  CALCULAR TOTALES
// ============================================================
export function calculateTotals(pricedLines: any[]) {
  const subtotal = pricedLines.reduce((s, l) => s + l.total, 0);

  return {
    subtotal,
    grand_total: subtotal, // si después agregas AWB u otros cargos
  };
}
