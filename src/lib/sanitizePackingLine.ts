// src/lib/sanitizePackingLine.ts
import type { PackingLine } from "@/domain/packing/types";

export function sanitizeLine(
  line: Partial<PackingLine>
): PackingLine {
  return {
    box_no: line.box_no ?? 0,
    code: line.code ?? "",
    description_en: line.description_en ?? "",
    form: line.form ?? "",
    size: line.size ?? "",
    pounds: line.pounds ?? 0,
    combined_with: line.combined_with,
  };
}
