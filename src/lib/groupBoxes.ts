import type { PackingLine } from "@/domain/packing/types";

export function groupBoxes(lines: PackingLine[]) {
  // 🔒 Solo cajas numéricas (evita errores TS)
  const map = new Map<number, PackingLine[]>();

  for (const l of lines) {
    if (typeof l.box_no !== "number") continue;

    if (!map.has(l.box_no)) {
      map.set(l.box_no, []);
    }

    map.get(l.box_no)!.push(l);
  }

  return Array.from(map.entries()).map(([box_no, boxLines]) => ({
    box_no,                          // 👉 Caja #X
    lines: boxLines,                 // 👉 1 o varias especies
    is_combined: boxLines.length > 1,// 👉 combinada si >1 línea
    total_lbs: boxLines.reduce(
      (sum, l) => sum + (l.pounds || 0),
      0
    ),
  }));
}

