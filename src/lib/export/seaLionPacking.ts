import ExcelJS from "exceljs";

export async function buildSeaLionPackingSheet(
  sheet: ExcelJS.Worksheet,
  packing: any
) {
  const lines = packing.lines ?? [];
  const client = packing.clientData ?? {};

  // ============================================================
  // 🔷 HEADER SUPERIOR (TIPO TEMPLATE SEA LION)
  // ============================================================

  sheet.getCell("A1").value = "SEA LION INTERNATIONAL";
  sheet.getCell("A1").font = { bold: true, size: 16 };

  sheet.getCell("D1").value = "PACKING LIST / ORDER TEMPLATE";
  sheet.getCell("D1").font = { bold: true, size: 14 };

  // ROW 3
  sheet.getCell("A3").value = "VENDOR CODE (DO NOT MODIFY)";
  sheet.getCell("B3").value = "VENDOR";
  sheet.getCell("C3").value = "COUNTRY OF ORIGIN";
  sheet.getCell("D3").value = "DESTINATION WAREHOUSE";
  sheet.getCell("E3").value = "FACTURA #";
  sheet.getCell("F3").value = "GUIA #";
  sheet.getCell("G3").value = "FECHA";

  // ROW 4 (VALUES)
  sheet.getCell("A4").value = "V0320"; // 🔧 puedes hacerlo dinámico después
  sheet.getCell("B4").value = "QUALITY FISH S.C DE R.L DE C.V";
  sheet.getCell("C4").value = "MEXICO-WILD";
  sheet.getCell("D4").value = "MIT";
  sheet.getCell("E4").value = packing.invoice_no;
  sheet.getCell("F4").value = packing.guide ?? "";
  sheet.getCell("G4").value = new Date(packing.created_at).toLocaleDateString("es-MX");

  // ============================================================
  // 🔷 TABLA HEADER
  // ============================================================

  const startRow = 6;

  sheet.getRow(startRow).values = [
    "Item Name/Producto",
    "Presentation/Presentacion",
    "Size/Talla",
    "Box Weight (in LBS)/Peso Por Caja (Libras)",
    "Box No / # de Caja",
    "Unit Price (Per LB)/Precio por Libra",
  ];

  sheet.getRow(startRow).font = { bold: true };

  // Column widths
  sheet.getColumn(1).width = 40;
  sheet.getColumn(2).width = 18;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 28;
  sheet.getColumn(5).width = 16;
  sheet.getColumn(6).width = 28;

  // ============================================================
  // 🔷 DATA (SIN AGRUPAR)
  // ============================================================

  const sortedLines = [...lines].sort(
    (a, b) => a.box_no - b.box_no
  );

  let row = startRow + 1;

  for (const l of sortedLines) {
    sheet.getRow(row).values = [
      l.description_en,
      l.form,
      l.size,
      l.pounds,
      l.box_no,
      l.price ?? "",
    ];

    row++;
  }
}