import ExcelJS from "exceljs";

export async function buildSeaLionPackingSheet(
  sheet: ExcelJS.Worksheet,
  packing: any
) {
  const lines = packing.lines ?? [];

  // ============================================================
  // 🔹 HEADER (IGUAL AL TEMPLATE)
  // ============================================================

  sheet.columns = [
    { header: "Item Name/Producto", key: "desc", width: 40 },
    { header: "Presentation/Presentacion", key: "form", width: 18 },
    { header: "Size/Talla", key: "size", width: 12 },
    { header: "Box Weight (in LBS)/Peso Por Caja (Libras)", key: "lbs", width: 28 },
    { header: "Box No / # de Caja", key: "box", width: 16 },
    { header: "Unit Price (Per LB)/Precio por Libra", key: "price", width: 28 },
  ];

  // 🔹 HEADER STYLE (opcional ligero)
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };

  // ============================================================
  // 🔹 ORDEN EXACTO (IMPORTANTE)
  // ============================================================

  const sortedLines = [...lines].sort(
    (a, b) => a.box_no - b.box_no
  );

  // ============================================================
  // 🔹 DATA (SIN AGRUPAR)
  // ============================================================

  for (const l of sortedLines) {
    sheet.addRow({
      desc: l.description_en,
      form: l.form,
      size: l.size,
      lbs: l.pounds,
      box: l.box_no,
      price: l.price ?? "",
    });
  }
}