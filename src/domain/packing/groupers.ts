// ============================================================
//  PACKING / PRICING / INVOICE GROUPERS
//  Reglas oficiales del sistema Quality Packing
// ============================================================

import type { PackingLine, PricingLine } from "./types";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function isRealBox(x: any): x is number {
  return typeof x === "number" && !isNaN(x);
}

function toRealBox(x: number | "MX"): number | null {
  return typeof x === "number" ? x : null;
}

function isMX(x: any): x is "MX" {
  return x === "MX";
}

// ------------------------------------------------------------
// Detectar grupos combinados
// ------------------------------------------------------------
export function detectMixedGroups(lines: PackingLine[]) {
  const groups: PackingLine[][] = [];
  let current: PackingLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];

    if (isRealBox(l.box_no)) {
      if (current.length) groups.push(current);
      current = [l];
      continue;
    }

    if (isMX(l.box_no)) {
      current.push(l);
      continue;
    }
  }

  if (current.length) groups.push(current);

  // solo mezcladas (min 2 filas)
  return groups.filter((g) => g.length > 1);
}

// ------------------------------------------------------------
// Rangos válidos (solo en packing normal, no Sea Lion)
// ------------------------------------------------------------
export function detectPackingRanges(lines: PackingLine[]) {
  const ranges: { start: number; end: number; items: PackingLine[] }[] = [];

  let start = 0;

  while (start < lines.length) {
    const base = lines[start];
    const baseBox = toRealBox(base.box_no);

    // Si no es caja real → no puede iniciar rango
    if (baseBox === null) {
      start++;
      continue;
    }

    let end = start;

    while (true) {
      const next = lines[end + 1];
      if (!next) break;

      const b1 = toRealBox(lines[end].box_no);
      const b2 = toRealBox(next.box_no);
      if (b1 === null || b2 === null) break;

      // deben ser consecutivas
      if (b2 !== b1 + 1) break;

      // deben ser idénticas
      if (
        next.description_en !== base.description_en ||
        next.form !== base.form ||
        next.size !== base.size ||
        next.pounds !== base.pounds
      ) {
        break;
      }

      end++;
    }

    if (end > start) {
      ranges.push({
        start: baseBox,
        end: toRealBox(lines[end].box_no)!,
        items: lines.slice(start, end + 1),
      });
      start = end + 1;
    } else {
      start++;
    }
  }

  return ranges;
}

// ------------------------------------------------------------
// Agrupar packing según cliente
// Sea Lion → NO AGRUPA RANGOS (usa cada caja individual)
// Otros → sí agrupan rangos
// Combinadas → nunca se agrupan
// ------------------------------------------------------------
export function groupPackingForClient(
  lines: PackingLine[],
  client_name: string
) {
  const isSeaLion =
    client_name.trim().toUpperCase() === "SEA LION INTERNATIONAL";

  if (isSeaLion) {
    // Sea Lion NO agrupa rangos
    return lines.map((l) => ({ ...l }));
  }

  // Resto de clientes → agrupar rangos
  const ranges = detectPackingRanges(lines);
  const result: PackingLine[] = [];

  let i = 0;
  while (i < lines.length) {
    const l = lines[i];

    const lb = toRealBox(l.box_no);
    if (lb === null) {
      // combinadas → igual
      result.push({ ...l });
      i++;
      continue;
    }

    // ¿inicia rango?
    const r = ranges.find((rg) => rg.start === lb);

    if (r) {
      result.push({
        box_no: `${r.start} - ${r.end}` as any,
        description_en: l.description_en,
        form: l.form,
        size: l.size,
        pounds: l.pounds,
      });
      i += r.items.length;
      continue;
    }

    // caja simple
    result.push({ ...l });
    i++;
  }

  return result;
}

// ------------------------------------------------------------
// Agrupación para FACTURA y PRICING
// ------------------------------------------------------------
export function groupForInvoice(lines: PricingLine[]) {
  const result: any[] = [];

  // 1) Detectar MIXED
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    const lb = toRealBox(l.box_no);

    const next = lines[i + 1];
    const nextMX = next && isMX(next.box_no);

    if (lb !== null && nextMX) {
      // Esta es una caja combinada
      const group: PricingLine[] = [];

      // primera línea → en factura se pone "1"
      group.push({ ...l, box_no: 1 });

      let j = i + 1;
      while (j < lines.length && isMX(lines[j].box_no)) {
        group.push({ ...lines[j], box_no: "MX" });
        j++;
      }

      result.push(...group);
      i = j;
      continue;
    }

    i++;
  }

  // 2) Agrupar NO MIXED
  const nonMixed = lines.filter((l, idx) => {
    const next = lines[idx + 1];
    if (next && isMX(next.box_no)) return false; // pertenece a mixed
    if (isMX(l.box_no)) return false;
    return true;
  });

  const groups = new Map<string, PricingLine[]>();

  for (const l of nonMixed) {
    const key = `${l.description_en}||${l.form}||${l.size}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(l);
  }

  for (const [key, arr] of groups.entries()) {
    const sample = arr[0];
    const totalBoxes = arr.length;
    const totalPounds = arr.reduce((s, x) => s + x.pounds, 0);

    result.push({
      box_no: totalBoxes,
      description_en: sample.description_en,
      form: sample.form,
      size: sample.size,
      pounds: totalPounds,
      price: sample.price,
      total: totalPounds * sample.price,
    });
  }

  return result;
}

export function groupForPricing(lines: PricingLine[]) {
  return groupForInvoice(lines);
}

