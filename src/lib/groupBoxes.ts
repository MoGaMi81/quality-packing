import type { PackingLine } from "@/domain/packing/types";

export type GroupedBox = {
  box_no: string;
  isCombined: boolean;
  lines: PackingLine[];
  total_lbs: number;
};

export function groupBoxes(lines: PackingLine[]): GroupedBox[] {
  const boxes = new Map<string, PackingLine[]>();

  for (const l of lines) {
    const boxKey = String(l.box_no); // 👈 CLAVE

    if (!boxes.has(boxKey)) {
      boxes.set(boxKey, []);
    }
    boxes.get(boxKey)!.push(l);
  }

  return Array.from(boxes.entries()).map(([box_no, boxLines]) => ({
    box_no,
    isCombined: boxLines.length > 1,
    lines: boxLines,
    total_lbs: boxLines.reduce(
      (sum, l) => sum + Number(l.pounds || 0),
      0
    ),
  }));
}
