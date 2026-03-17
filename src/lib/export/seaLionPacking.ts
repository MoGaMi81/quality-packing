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

  sheet.getCell("A1:A3").value = "SEA LION INTERNATIONAL";
  sheet.getCell("A1:A3").font = { bold: true, size: 16 };

  sheet.getCell("B1:G3").value = "PACKING LIST / ORDER TEMPLATE";
  sheet.getCell("B1:G3").font = { bold: true, size: 14 };

  // ROW 3
  sheet.getCell("A4").value = "VENDOR CODE (DO NOT MODIFY)";
  sheet.getCell("B4").value = "VENDOR";
  sheet.getCell("C4").value = "COUNTRY OF ORIGIN";
  sheet.getCell("D4").value = "DESTINATION WAREHOUSE";
  sheet.getCell("E4").value = "FACTURA #";
  sheet.getCell("F4").value = "GUIA #";
  sheet.getCell("G4").value = "FECHA";

  // ROW 4 (VALUES)
  sheet.getCell("A5").value = "V0320"; // 🔧 puedes hacerlo dinámico después
  sheet.getCell("B5").value = "QUALITY FISH S.C DE R.L DE C.V";
  sheet.getCell("C5").value = "MEXICO-WILD";
  sheet.getCell("D5").value = "MIT";
  sheet.getCell("E5").value = packing.invoice_no;
  sheet.getCell("F5").value = packing.guide ?? "";
  sheet.getCell("G5").value = new Date(packing.created_at).toLocaleDateString("es-MX");

  // ============================================================
  // 🔷 TABLA HEADER
  // ============================================================

  const startRow = 7;

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