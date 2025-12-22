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
    const boxNo = Number(line.box_no);
    if (!boxes.has(boxNo)) {
      boxes.set(boxNo, []);
    }
    boxes.get(boxNo)!.push(line);
  }

  return Array.from(boxes.entries()).map(([box_no, boxLines]) => {
    const isCombined = boxLines.length > 1;

    return {
      box_no,
      isCombined,
      lines: boxLines,
      total_lbs: isCombined
        ? 0 // 🔴 no sumar si está combinada
        : boxLines.reduce((sum, l) => sum + Number(l.pounds), 0),
    };
  });
}
