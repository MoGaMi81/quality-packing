import type { PackingLine } from "@/domain/packing/types";

export type GroupedBox = {
  box_no: number;
  isCombined: boolean;
  lines: PackingLine[];
  total_lbs: number;
};

export function groupBoxes(
  lines: PackingLine[]
): GroupedBox[] {
  const map = new Map<number, PackingLine[]>();

  for (const l of lines) {
    const boxNo = Number(l.box_no);
    if (!map.has(boxNo)) map.set(boxNo, []);
    map.get(boxNo)!.push(l);
  }

  return Array.from(map.entries()).map(
    ([box_no, boxLines]) => ({
      box_no,
      isCombined: boxLines.length > 1,
      lines: boxLines,
      total_lbs: boxLines.reduce(
        (sum, l) => sum + Number(l.pounds),
        0
      ),
    })
  );
}

