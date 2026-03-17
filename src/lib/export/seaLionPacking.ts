import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

export async function buildSeaLionPackingSheet(
  sheet: ExcelJS.Worksheet,
  packing: any
) {
  const lines = packing.lines ?? [];

  // ============================================================
  // 🔷 MERGES HEADER
  // ============================================================

  sheet.mergeCells("A1:A3");
  sheet.mergeCells("B1:G3");

  // ============================================================
  // 🖼️ LOGO SEA LION (A1:A3)
  // ============================================================

 try {
  const imagePath = path.join(process.cwd(), "public", "sea-lion.png");

  const file = fs.readFileSync(imagePath);
  const buffer = Buffer.from(file);

  const imageId = sheet.workbook.addImage({
  buffer: Buffer.from(file) as any,
  extension: "png",
});

  sheet.addImage(imageId, {
    tl: { col: 0, row: 0 },
    ext: { width: 120, height: 70 },
  });

} catch (e) {
  console.log("Logo error:", e);
}

  // ============================================================
  // 🔷 TITULO
  // ============================================================

  const titleCell = sheet.getCell("B1");

  titleCell.value = "PACKING LIST / ORDER TEMPLATE";
  titleCell.font = { bold: true, size: 16 };

  titleCell.alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  // ============================================================
  // 🔷 HEADERS FILA 4
  // ============================================================

  sheet.getRow(4).values = [
    "VENDOR CODE (DO NOT MODIFY)",
    "VENDOR",
    "COUNTRY OF ORIGIN",
    "DESTINATION WAREHOUSE",
    "FACTURA #",
    "GUIA #",
    "FECHA",
  ];

  sheet.getRow(4).font = { bold: true };

  // ============================================================
  // 🔷 VALUES FILA 5
  // ============================================================

  sheet.getRow(5).values = [
    "V0320",
    "QUALITY FISH S.C DE R.L DE C.V",
    "MEXICO-WILD",
    "MIT",
    packing.invoice_no,
    packing.guide ?? "",
    new Date(packing.created_at).toLocaleDateString("es-MX"),
  ];

  // ============================================================
  // 🔷 TABLA
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
  // 🔷 DATA (ORDEN EXACTO)
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
      l.price ?? "$ #,##0.00",
    ];

    row++;
  }
}