import type { PackingLine } from "./types";

export type ViewBox = {
  box_no: number | string;
  isCombined: boolean;
  lines: PackingLine[];
  total_lbs: number;
};

export function groupBoxesForView(
  lines: PackingLine[]
): ViewBox[] {
  const map = new Map<string, ViewBox>();

  for (const line of lines) {
    const key =
      line.is_combined && line.combined_with
        ? `C-${line.box_no}-${line.combined_with}`
        : `S-${line.box_no}`;

    if (!map.has(key)) {
      map.set(key, {
        box_no: line.box_no,
        isCombined: !!line.is_combined,
        lines: [],
        total_lbs: 0,
      });
    }

    const box = map.get(key)!;
    box.lines.push(line);
    box.total_lbs += Number(line.pounds) || 0;
  }

  return Array.from(map.values()).sort((a, b) => {
    const na = Number(a.box_no);
    const nb = Number(b.box_no);
    if (isNaN(na) || isNaN(nb)) return 0;
    return na - nb;
  });
}
