import ExcelJS from "exceljs";

export async function buildSeaLionPackingSheet(
  sheet: ExcelJS.Worksheet,
  packing: any
) {
  const lines = packing.lines ?? [];

  // HEADER EXACTO (IMPORTANTE para su sistema)
  sheet.columns = [
    { header: "Boxes", key: "boxes", width: 10 },
    { header: "Pounds", key: "pounds", width: 12 },
    { header: "Description", key: "desc", width: 35 },
    { header: "Size", key: "size", width: 10 },
    { header: "Form", key: "form", width: 10 },
    { header: "Scientific Name", key: "sci", width: 25 },
    { header: "Price", key: "price", width: 10 },
    { header: "Amount", key: "amount", width: 12 },
  ];

  // 🔴 IMPORTANTE: NO agrupes si Sea Lion no lo quiere
  for (const l of lines) {
    const amount = (l.pounds ?? 0) * (l.price ?? 0);

    sheet.addRow({
      boxes: 1,
      pounds: l.pounds,
      desc: l.description_en,
      size: l.size,
      form: l.form,
      sci: l.species?.scientific_name ?? "",
      price: l.price,
      amount,
    });
  }
}