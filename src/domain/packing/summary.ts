import { PackingLine, InvoiceLine } from "./types";

// src/domain/packing/summary.ts
export function buildInvoice(lines: PackingLine[], sciByDesc: Record<string,string>): InvoiceLine[] {
  // Agrupar por (description_en, size, form), pero contando cada box_no una sola vez
  const groups = new Map<string, { boxes:Set<number>; pounds:number }>();
  const keyOf = (l: PackingLine) => `${l.description_en}|||${l.size}|||${l.form}`;
  lines.forEach(l => {
    const k = keyOf(l);
    if (!groups.has(k)) groups.set(k, { boxes: new Set<number>(), pounds: 0 });
    const g = groups.get(k)!;
    g.boxes.add(l.combined_with ?? l.box_no);    // combinadas → misma caja
    g.pounds += l.pounds;
  });

  return [...groups.entries()].map(([k, g]) => {
    const [description_en, size, form] = k.split("|||");
    const scientific_name = sciByDesc[description_en] || "";
    return { boxes: g.boxes.size, pounds: g.pounds, description_en, size, form, scientific_name };
  });
}

