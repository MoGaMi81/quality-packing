// ============================================================
//  PACKING / PRICING / INVOICE GROUPERS
//  Reglas oficiales del sistema Quality Packing
// ============================================================

import type { PackingLine, PricingLine } from "./types";


// ------------------------------------------------------------
// Detectar si un conjunto de líneas pertenece a una caja combinada
// Caja combinada = Primera línea con número + líneas siguientes MX
// ------------------------------------------------------------
export function detectMixedGroups(lines: PackingLine[]) {
  const groups: PackingLine[][] = [];
  let current: PackingLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];

    // Si es una línea con número → inicia posible grupo
    const isNumber = typeof l.box_no === "number";

    if (isNumber) {
      // Si había un grupo previo → guardarlo
      if (current.length) groups.push(current);
      current = [l];
      continue;
    }

    // Si dice MX → pertenece al grupo actual
    if (!isNumber && l.box_no === null) {
      current.push(l);
      continue;
    }
  }

  // Último grupo
  if (current.length) groups.push(current);

  // Filtrar solo los grupos que realmente tienen MX
  return groups.filter(g => g.length > 1);
}


// ------------------------------------------------------------
// Detectar rangos válidos en PACKING (cliente ≠ SEA LION)
// Reglas:
//   - misma especie, talla, form, peso
//   - consecutivas
// ------------------------------------------------------------
export function detectPackingRanges(lines: PackingLine[]) {
  const ranges: { start: number; end: number; items: PackingLine[] }[] = [];

  let start = 0;

  while (start < lines.length) {

    const base = lines[start];
    let end = start;

    // Saltar si base es MX o combinada
    if (typeof base.box_no !== "number") {
      start++;
      continue;
    }

    // Intentar extender rango
    while (
      end + 1 < lines.length &&
      typeof lines[end + 1].box_no === "number" &&
      lines[end + 1].description_en === base.description_en &&
      lines[end + 1].form === base.form &&
      lines[end + 1].size === base.size &&
      lines[end + 1].pounds === base.pounds &&
      lines[end + 1].box_no === lines[end].box_no + 1
    ) {
      end++;
    }

    // Si se encontró rango real (más de uno)
    if (end > start) {
      ranges.push({
        start: lines[start].box_no!,
        end: lines[end].box_no!,
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
// - SEA LION → NO agrupa rangos
// - Otros → agrupa rangos
// Mixed boxes → siempre tal cual (sin agrupar)
// ------------------------------------------------------------
export function groupPackingForClient(
  lines: PackingLine[],
  client_name: string
) {
  const isSeaLion = client_name.trim().toUpperCase() === "SEA LION INTERNATIONAL";

  if (isSeaLion) {
    // Versión NO agrupada (solo mixed se mantiene)
    return lines.map(l => ({ ...l }));
  }

  // Versión agrupada por rangos
  const ranges = detectPackingRanges(lines);

  const result: any[] = [];
  let i = 0;

  while (i < lines.length) {
    const l = lines[i];

    // Mixed boxes → escribir tal cual
    if (typeof l.box_no !== "number") {
      result.push({ ...l });
      i++;
      continue;
    }

    // ¿Esta línea inicial está en algún rango?
    const r = ranges.find(rg => rg.start === l.box_no);

    if (r) {
      // Es un rango
      result.push({
        box_no: `${r.start} - ${r.end}`,
        description_en: l.description_en,
        form: l.form,
        size: l.size,
        pounds: l.pounds,
        total_pounds: r.items.reduce((s, x) => s + x.pounds, 0),
      });
      i += r.items.length;
      continue;
    }

    // Caja normal
    result.push({ ...l });
    i++;
  }

  return result;
}



// ------------------------------------------------------------
// AGRUPACIÓN PARA PRICING Y FACTURA
// - Mixed boxes NO se agrupan
// - Todo lo demás se agrupa por especie + talla + form
//   (aunque NO sean consecutivas y aunque tengan pesos distintos)
// ------------------------------------------------------------
export function groupForInvoice(lines: PricingLine[]) {
  const result: any[] = [];

  // 1) Primero detectar mixed boxes (combinadas)
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];

    const isMixedHead = typeof l.box_no === "number" && l.box_no !== null;
    const next = lines[i + 1];

    // Mixed box detection
    if (isMixedHead && next && next.box_no === (null as any)) {
      // Este es un grupo combinado
      const group: PricingLine[] = [];

      // Primera línea → será "1" en factura
      group.push({ ...l, box_no: 1 });

      let j = i + 1;
      while (j < lines.length && lines[j].box_no === (null as any)) {
        // Estas son MX
        group.push({ ...lines[j], box_no: "MX" as any });
        j++;
      }

      result.push(...group);
      i = j;
      continue;
    }

    // No mixed → manejar después en agrupador general
    i++;
  }


  // 2) Agrupar TODO lo NO mixed
  const nonMixed = lines.filter(l => {
    if (typeof l.box_no !== "number") return false;
    // Si una línea pertenece a un mixed group, ya se manejó arriba
    const next = lines[lines.indexOf(l) + 1];
    if (next && next.box_no === (null as any)) return false;
    return true;
  });

  // Agrupador general por especie/+size/+form
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



// ------------------------------------------------------------
// AGRUPACIÓN PARA PRICING (idéntica a factura, pero 
// conserva precios por línea desde PricingPage)
// ------------------------------------------------------------
export function groupForPricing(lines: PricingLine[]) {
  return groupForInvoice(lines);
}
