import type { PackingLine } from "@/domain/packing/types";

export type GroupedBox = {
  box_no: number;
  lines: PackingLine[];
  total_lbs: number;
};

export function groupBoxes(lines: PackingLine[]): GroupedBox[] {
  const map = new Map<number, PackingLine[]>();

  for (const l of lines) {
    if (!map.has(l.box_no)) {
      map.set(l.box_no, []);
    }
    map.get(l.box_no)!.push(l);
  }

  return Array.from(map.entries()).map(([box_no, boxLines]) => ({
    box_no,
    lines: boxLines,
    total_lbs: boxLines.reduce((s, l) => s + l.pounds, 0),
  }));
}
