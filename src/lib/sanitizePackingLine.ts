// src/lib/sanitizePackingLine.ts
import type { PackingLine } from "@/domain/packing/types";

export function sanitizePackingLine(
  line: Partial<PackingLine>
): PackingLine {
  return {
    box_no: line.box_no ?? 0,
    code: line.code ?? "",
    description_en: line.description_en ?? "",
    form: line.form ?? "",
    size: line.size ?? "",
    pounds: line.pounds ?? 0,
    scientific_name: line.scientific_name ?? null,
    combined_with: line.combined_with ?? null,

    // ✅ ESTE ERA EL FALTANTE
    is_combined: line.is_combined ?? false,
  };
}
