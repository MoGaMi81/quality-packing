import type { PackingLine } from "@/domain/packing/types";

export type GroupedBox = {
  box_no: number;
  isCombined: boolean;
  lines: PackingLine[];
  total_lbs: number;
};

export function groupBoxes(lines: PackingLine[]): GroupedBox[] {
  const boxes = new Map<number, PackingLine[]>();

  for (const line of lines) {
    const boxNo = Number(line.box_no); // 🔴 fuerza number
    if (!boxes.has(boxNo)) {
      boxes.set(boxNo, []);
    }
    boxes.get(boxNo)!.push(line);
  }

  return Array.from(boxes.entries()).map(([box_no, boxLines]) => ({
    box_no,
    isCombined: boxLines.length > 1,
    lines: boxLines,
    total_lbs: boxLines.reduce((sum, l) => sum + Number(l.pounds), 0),
  }));
}
