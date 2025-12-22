import type { PackingLine } from "@/domain/packing/types";

export type GroupedBox = {
  box_no: string | number;
  isCombined: boolean;
  lines: PackingLine[];
  total_lbs: number;
  box_count: number; // siempre 1
};

export function groupBoxes(lines: PackingLine[]): GroupedBox[] {
  const boxes = new Map<string | number, PackingLine[]>();

  for (const line of lines) {
    const key = line.box_no;

    if (!boxes.has(key)) {
      boxes.set(key, []);
    }

    boxes.get(key)!.push(line);
  }

  return Array.from(boxes.entries()).map(([box_no, boxLines]) => ({
    box_no,
    isCombined: boxLines.length > 1,
    lines: boxLines,
    total_lbs: boxLines.reduce(
      (sum, l) => sum + Number(l.pounds || 0),
      0
    ),
    box_count: 1,
  }));
}


