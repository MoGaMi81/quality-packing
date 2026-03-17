import ExcelJS from "exceljs";

export async function buildSeaLionExcel(packing: any) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("SEA LION");

  /* ============================================================
     HEADER
  ============================================================ */

  ws.getCell("A1").value = "SOC. COOP. QUALITY FISH";
  ws.getCell("A2").value = "CHELEM, YUCATAN, MEX.";
  ws.getCell("A3").value = "QFI221111RI5";

  ws.getCell("E1").value = "SEA LION INTERNATIONAL";
  ws.getCell("E2").value = "2000 BANKS ROAD SUITE 222";
  ws.getCell("E3").value = "MARGATE, FL 33063";

  ws.getCell("E5").value = "INVOICE:";
  ws.getCell("F5").value = packing.invoice_no;

  ws.getCell("E6").value = "DATE:";
  ws.getCell("F6").value = new Date(packing.created_at);

  ws.getCell("A8").value = "COUNTRY OF ORIGIN: MEXICO";

  ws.getCell("A8").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFFF00" }, // amarillo
  };

  ws.mergeCells("A8:H8");

  /* ============================================================
     TABLE HEADER
  ============================================================ */

  const startRow = 10;

  ws.getRow(startRow).values = [
    "Boxes",
    "Pounds",
    "Description",
    "Size",
    "Form",
    "Scientific Name",
    "Price",
    "Amount",
  ];

  ws.getRow(startRow).font = { bold: true };

  /* ============================================================
     DATA
  ============================================================ */

  let row = startRow + 1;

  let totalBoxes = 0;
  let totalLbs = 0;
  let totalAmount = 0;

  const grouped = new Map<string, any>();

  for (const l of packing.lines) {
    const key = `${l.description_en}|${l.size}|${l.form}|${l.price}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        boxes: 0,
        pounds: 0,
        ...l,
      });
    }

    const g = grouped.get(key);
    g.boxes += 1;
    g.pounds += l.pounds;
  }

  for (const g of grouped.values()) {
    const amount = g.pounds * (g.price || 0);

    ws.getRow(row).values = [
      g.boxes,
      g.pounds,
      g.description_en,
      g.size,
      g.form,
      g.scientific_name || "",
      g.price || 0,
      amount,
    ];

    totalBoxes += g.boxes;
    totalLbs += g.pounds;
    totalAmount += amount;

    row++;
  }

  /* ============================================================
     TOTALS
  ============================================================ */

  ws.getRow(row + 1).values = [
    totalBoxes,
    totalLbs,
    "",
    "",
    "",
    "",
    "",
    totalAmount,
  ];

  ws.getRow(row + 1).font = { bold: true };

  return wb;
}