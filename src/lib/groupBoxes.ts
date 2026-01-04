import type { PackingLine } from "@/domain/packing/types";

type GroupedBox = {
  box_no: number | "MX";
  isCombined: boolean;
  lines: PackingLine[];
  total_lbs: number;
};

export function groupBoxes(lines: PackingLine[]): GroupedBox[] {
  const map = new Map<string, GroupedBox>();

  for (const line of lines) {
    // 🔑 clave ÚNICA de caja
    const key =
      line.is_combined && line.combined_group
        ? `C-${line.box_no}-${line.combined_group}`
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
    if (a.box_no === "MX" || b.box_no === "MX") return 0;
    return Number(a.box_no) - Number(b.box_no);
  });
}

