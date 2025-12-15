import { PackingLine, InvoiceLine } from "./types";

export function buildInvoice(
  lines: PackingLine[],
  sciByDesc: Record<string, string>
): InvoiceLine[] {
  const groups = new Map<
    string,
    { boxes: Set<number>; pounds: number }
  >();

  const keyOf = (l: PackingLine) =>
    `${l.description_en}|||${l.size}|||${l.form}`;

  for (const l of lines) {
    const k = keyOf(l);
    if (!groups.has(k))
      groups.set(k, { boxes: new Set<number>(), pounds: 0 });

    const g = groups.get(k)!;

    // Si es combinada, todas las líneas del grupo comparten el mismo número
    const realBox =
      typeof l.box_no === "number"
        ? l.box_no
        : typeof l.combined_with === "number"
        ? l.combined_with
        : null;

    if (realBox !== null) g.boxes.add(realBox);

    g.pounds += l.pounds;
  }

  return [...groups.entries()].map(([k, g]) => {
    const [description_en, size, form] = k.split("|||");
    const scientific_name = sciByDesc[description_en] || "";

    return {
      amount: "",
      price: "",
      boxes: g.boxes.size,
      pounds: g.pounds,
      description_en,
      size,
      form,
      scientific_name,
    };
  });
}


