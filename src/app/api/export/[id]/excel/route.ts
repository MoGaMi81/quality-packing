import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function numberToWords(num: number): string {
  const a = [
    "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN",
    "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN",
    "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN",
    "EIGHTEEN", "NINETEEN"
  ];

  const b = [
    "", "", "TWENTY", "THIRTY", "FORTY", "FIFTY",
    "SIXTY", "SEVENTY", "EIGHTY", "NINETY"
  ];

  if (num === 0) return "ZERO";

  if (num < 20) return a[num];

  if (num < 100)
    return b[Math.floor(num / 10)] + (num % 10 ? " " + a[num % 10] : "");

  if (num < 1000)
    return (
      a[Math.floor(num / 100)] +
      " HUNDRED" +
      (num % 100 ? " " + numberToWords(num % 100) : "")
    );

  if (num < 1000000)
    return (
      numberToWords(Math.floor(num / 1000)) +
      " THOUSAND" +
      (num % 1000 ? " " + numberToWords(num % 1000) : "")
    );

  if (num < 1000000000)
    return (
      numberToWords(Math.floor(num / 1000000)) +
      " MILLION" +
      (num % 1000000 ? " " + numberToWords(num % 1000000) : "")
    );

  return "";
}

function formatAmountInWords(amount: number): string {
  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);

  return `${numberToWords(dollars)} DOLLARS AND ${cents
    .toString()
    .padStart(2, "0")}/100 USD`;
}

export const runtime = "nodejs";
export async function GET(req: Request, { params }: { params: { id: string } }) {

const wb = new ExcelJS.Workbook();
const invoiceSheet = wb.addWorksheet("Invoice");
const packingSheet = wb.addWorksheet("Packing");
const darkBlueText = { argb: "FF1F4E79" };
const accentBlue = { argb: "FF2F75B5" };

// 🔹 FUENTES HEADER (PONER AQUÍ)
const headerFontBig = { name: "Seaford", size: 20, bold: true };
const headerFontMedium = { name: "Seaford", size: 14, bold: true };
const headerFontAWBNumber = { name: "Seaford", size: 18, bold: true };
const headerFontAWBLabel = { name: "Seaford", size: 13, bold: true };


  // ============================================================
  // 1️⃣ PACKING
  // ============================================================

  const { data: packing, error: e1 } = await supabase
    .from("packings")
    .select(`
      id,
      invoice_no,
      guide,
      client_code,
      client_name,
      created_at
    `)
    .eq("id", params.id)
    .single();

  if (e1 || !packing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // ============================================================
  // 2️⃣ CLIENTE REAL DESDE clients
  // ============================================================

  const { data: clientData } = await supabase
    .from("clients")
    .select("name, address, city, state, zip, tax_id")
    .eq("code", packing.client_code)
    .single();

  const clientName =
    clientData?.name ?? packing.client_name ?? "";

  const clientAddressLine1 =
    clientData?.address ?? "";

  const clientAddressLine2 = clientData
    ? `${clientData.city ?? ""}, ${clientData.state ?? ""} ${clientData.zip ?? ""}`
    : "";

  const clientTaxId = clientData?.tax_id ?? "";

  // ============================================================
  // 3️⃣ LÍNEAS
  // ============================================================

  const { data: lines, error: e2 } = await supabase
    .from("packing_lines")
    .select(`
      box_no,
      description_en,
      size,
      form,
      pounds,
      price,
      is_combined,
      species (
        scientific_name
      )
    `)
    .eq("packing_id", packing.id)
    .order("box_no");

  if (e2) {
    return NextResponse.json({ error: e2.message }, { status: 500 });
  }

  const headerRow = packingSheet.getRow(13);

// ============================================================
// 🔧 UTILIDADES (ARRIBA DEL TODO)
// ============================================================
function safeMerge(sheet: any, range: string) {
  const merges = sheet._merges || {};

  if (!Object.values(merges).some((m: any) => m.model?.ref === range)) {
    sheet.mergeCells(range);
  }
}

function setOuterBorder(
  sheet: any,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number
) {
  for (let c = startCol; c <= endCol; c++) {
    sheet.getCell(startRow, c).border = {
      ...sheet.getCell(startRow, c).border,
      top: { style: "medium" },
    };
    sheet.getCell(endRow, c).border = {
      ...sheet.getCell(endRow, c).border,
      bottom: { style: "medium" },
    };
  }

  for (let r = startRow; r <= endRow; r++) {
    sheet.getCell(r, startCol).border = {
      ...sheet.getCell(r, startCol).border,
      left: { style: "medium" },
    };
    sheet.getCell(r, endCol).border = {
      ...sheet.getCell(r, endCol).border,
      right: { style: "medium" },
    };
  }
}

// ============================================================
// ================= PACKING =================
// ============================================================

packingSheet.pageSetup.paperSize = 9;
packingSheet.pageSetup.orientation = "portrait";

// Mismas columnas que invoice
packingSheet.getColumn("A").width = 6;
packingSheet.getColumn("B").width = 4;
packingSheet.getColumn("C").width = 6;
packingSheet.getColumn("D").width = 38;
packingSheet.getColumn("E").width = 12;
packingSheet.getColumn("F").width = 10;
packingSheet.getColumn("G").width = 12;
packingSheet.getColumn("H").width = 16;

// ============================================================
// 🔷 PACKING HEADER COMPLETO (IGUAL A INVOICE)
// ============================================================

// 🔹 LOGO (A1:D5)
try {
  const logoUrl = new URL("/logo.jpeg", req.url).toString();
  const response = await fetch(logoUrl);

  if (response.ok) {
    const arrayBuffer = await response.arrayBuffer();
    const base64Image =
      "data:image/png;base64," + Buffer.from(arrayBuffer).toString("base64");

    const imageId = wb.addImage({
      base64: base64Image,
      extension: "png",
    });

    packingSheet.addImage(imageId, {
      tl: { col: 0, row: 0 }, // A1
      ext: { width: 128, height: 110 },
    });
  }
} catch (error) {
  console.log("Logo fetch error:", error);
}

// 🔹 VENDEDOR (A6:D7)
safeMerge(packingSheet, "A6:D7");
safeMerge(packingSheet, "A8:D12");

const vendorCell = packingSheet.getCell("A6");
vendorCell.value = "SOC. COOP. QUALITY FISH";
vendorCell.font = {
  name: "Seaford",
  size: 20,
  bold: true,
  color: darkBlueText,
};
vendorCell.alignment = { horizontal: "center", vertical: "middle" };

const vendorInfo = packingSheet.getCell("A8");
vendorInfo.value =
  "CALLE 21 S/N X 136 Y 138\nCHELEM, YUCATAN, MEX.\nRFC: QFI221111RI5\nFDA: 1506224494";
vendorInfo.font = {
  name: "Seaford",
  size: 14,
  bold: true,
  color: accentBlue,
};
vendorInfo.alignment = {
  wrapText: true,
  vertical: "top",
  horizontal: "left",
};

// 🔹 CLIENTE (E1:H3)
safeMerge(packingSheet, "E1:H3");
safeMerge(packingSheet, "E4:H7");

const clientCell = packingSheet.getCell("E1");
clientCell.value = clientName.toUpperCase();
clientCell.font = {
  name: "Seaford",
  size: 20,
  bold: true,
  color: darkBlueText,
};
clientCell.alignment = { horizontal: "center", vertical: "middle" };

const clientAddress = packingSheet.getCell("E4");
clientAddress.value =
  `${clientData?.address ?? ""}\n${clientData?.city ?? ""}, ${clientData?.state ?? ""} ${clientData?.zip ?? ""}`;
clientAddress.font = {
  name: "Seaford",
  size: 14,
  bold: true,
  color: accentBlue,
};
clientAddress.alignment = {
  wrapText: true,
  vertical: "top",
  horizontal: "left",
};

// 🔹 TAX ID
safeMerge(packingSheet, "E8:H8");
const taxCell = packingSheet.getCell("E8");
taxCell.value = `TAX ID # ${clientData?.tax_id ?? ""}`;
taxCell.font = {
  name: "Seaford",
  size: 14,
  bold: true,
  color: accentBlue,
};
taxCell.alignment = { horizontal: "left", vertical: "middle" };

// 🔹 AWB
safeMerge(packingSheet, "F9:H9");

packingSheet.getCell("E9").value = "AWB";
packingSheet.getCell("E9").font = headerFontAWBLabel;
packingSheet.getCell("E9").alignment = { horizontal: "left", vertical: "middle" };

packingSheet.getCell("F9").value = packing.guide ?? "";
packingSheet.getCell("F9").font = headerFontAWBNumber;
packingSheet.getCell("F9").alignment = { horizontal: "right", vertical: "middle" };
setOuterBorder(packingSheet, 9, 9, 5, 8);

// 🔹 INVOICE
safeMerge(packingSheet, "E10:F10");
safeMerge(packingSheet, "G10:H10");

packingSheet.getCell("E10").value = "INVOICE";
packingSheet.getCell("E10").font = headerFontMedium;
packingSheet.getCell("E10").alignment = { horizontal: "left", vertical: "middle" };

packingSheet.getCell("G10").value = packing.invoice_no;
packingSheet.getCell("G10").font = headerFontMedium;
packingSheet.getCell("G10").alignment = { horizontal: "right", vertical: "middle" };
setOuterBorder(packingSheet, 10, 10, 5, 8);

// 🔹 DATE
safeMerge(packingSheet, "E11:F11");
safeMerge(packingSheet, "G11:H11");

packingSheet.getCell("E11").value = "DATE";
packingSheet.getCell("E11").font = headerFontMedium;
packingSheet.getCell("E11").alignment = { horizontal: "left", vertical: "middle" };

packingSheet.getCell("G11").value = packing.created_at?.slice(0, 10);
packingSheet.getCell("G11").font = headerFontMedium;
packingSheet.getCell("G11").alignment = { horizontal: "right", vertical: "middle" };
setOuterBorder(packingSheet, 11, 11, 5, 8);

// 🔹 COUNTRY OF ORIGIN
safeMerge(packingSheet, "E12:H12");

const countryCell = packingSheet.getCell("E12");
countryCell.value = "COUNTRY OF ORIGIN: MEXICO";
countryCell.font = headerFontMedium;
countryCell.alignment = { horizontal: "left", vertical: "middle" };
countryCell.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFFF00" },
};
setOuterBorder(packingSheet, 12, 12, 5, 8);

// 🔹 BORDES
setOuterBorder(packingSheet, 1, 12, 1, 4);
setOuterBorder(packingSheet, 1, 8, 5, 8);

// 🔹 Fondo blanco header completo (Packing)
for (let r = 1; r <= 12; r++) {
  for (let c = 1; c <= 8; c++) {
    packingSheet.getCell(r, c).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
  }
}

// 🔷 TABLE HEADER
const startRow = 13;
let packingRow = 14;

packingSheet.getRow(13).height = 40;

// A13:C13 combinado
safeMerge(packingSheet, "A13:C13");

packingSheet.getCell("A13").value = "BOX NO.";
packingSheet.getCell("A13").font = { name: "Seaford", bold: true };
packingSheet.getCell("A13").alignment = {
  horizontal: "center",
  vertical: "middle",
};

// Resto headers
packingSheet.getCell("D13").value = "DESCRIPTION";
packingSheet.getCell("E13").value = "FORM";
packingSheet.getCell("F13").value = "LB/BOX";
packingSheet.getCell("G13").value = "SIZE";
packingSheet.getCell("H13").value = "TOTAL WEIGTH";

for (let c = 1; c <= 8; c++) {
  const cell = packingSheet.getCell(13, c);
  cell.font = { name: "Seaford", bold: true };
  cell.alignment = { horizontal: "center", vertical: "middle" };
}

// ============================================================
// 🔹 AGRUPAR POR RANGO (PACKING GENERAL)
// ============================================================

const sortedLines = [...(lines ?? [])].sort(
  (a, b) => a.box_no - b.box_no
);

type PackingGroup = {
  startBox: number;
  endBox: number;
  description: string;
  form: string;
  size: string;
  poundsPerBox: number;
  scientific: string;
  boxCount: number;
  totalWeight: number;
};

const groups: PackingGroup[] = [];

for (let i = 0; i < sortedLines.length; i++) {
  const current = sortedLines[i];

  const scientificName =
    current.species?.[0]?.scientific_name ?? "";

  if (groups.length === 0) {
    groups.push({
      startBox: current.box_no,
      endBox: current.box_no,
      description: current.description_en,
      form: current.form,
      size: current.size,
      poundsPerBox: current.pounds,
      scientific: scientificName,
      boxCount: 1,
      totalWeight: current.pounds,
    });
    continue;
  }

  const last = groups[groups.length - 1];

  const sameProduct =
    last.description === current.description_en &&
    last.form === current.form &&
    last.size === current.size &&
    last.poundsPerBox === current.pounds &&
    last.scientific === scientificName;

  const consecutive = current.box_no === last.endBox + 1;

  if (sameProduct && consecutive) {
    last.endBox = current.box_no;
    last.boxCount++;
    last.totalWeight += current.pounds;
  } else {
    groups.push({
      startBox: current.box_no,
      endBox: current.box_no,
      description: current.description_en,
      form: current.form,
      size: current.size,
      poundsPerBox: current.pounds,
      scientific: scientificName,
      boxCount: 1,
      totalWeight: current.pounds,
    });
  }
}

// ============================================================
// 🔹 ITEMS (PACKING GENERAL 8 COLUMNAS)
// ============================================================

groups.forEach((g) => {

  const isRange = g.startBox !== g.endBox;

  packingSheet.getCell(`A${packingRow}`).value = g.startBox;
  packingSheet.getCell(`B${packingRow}`).value = isRange ? "-" : "";
  packingSheet.getCell(`C${packingRow}`).value = isRange ? g.endBox : "";

  packingSheet.getCell(`D${packingRow}`).value = g.description;
  packingSheet.getCell(`E${packingRow}`).value = g.form;
  packingSheet.getCell(`F${packingRow}`).value = g.poundsPerBox;
  packingSheet.getCell(`G${packingRow}`).value = g.size;
  packingSheet.getCell(`H${packingRow}`).value = g.totalWeight;

  for (let col = 1; col <= 8; col++) {
    const cell = packingSheet.getCell(packingRow, col);

    cell.font = {
      name: "Calibri",
      size: 12,
    };

    cell.border = {
      top: { style: "thin", color: { argb: "FFB7D7F0" } },
      left: { style: "thin", color: { argb: "FFB7D7F0" } },
      bottom: { style: "thin", color: { argb: "FFB7D7F0" } },
      right: { style: "thin", color: { argb: "FFB7D7F0" } },
    };
  }

  packingRow++;
});


// ============================================================
// 🔹 TOTALES PACKING (UNA SOLA VEZ – FUERA DEL FOR)
// ============================================================

// Última fila usada
const lastDataRow = packingRow - 1;

// Exactamente 3 filas abajo
const totalsRow = lastDataRow + 3;

// Totales reales
const totalBoxesPacking = groups.reduce(
  (sum, g) => sum + g.boxCount,
  0
);

const totalWeightPacking = groups.reduce(
  (sum, g) => sum + g.totalWeight,
  0
);

// Merge solo aquí (una vez)
packingSheet.mergeCells(`A${totalsRow}:G${totalsRow}`);

const totalLabelCell = packingSheet.getCell(`A${totalsRow}`);
totalLabelCell.value = `TOTAL BOXES ${totalBoxesPacking}`;
totalLabelCell.font = {
  name: "Calibri",
  bold: true,
};
totalLabelCell.alignment = {
  horizontal: "right",
  vertical: "middle",
};

const totalValueCell = packingSheet.getCell(`H${totalsRow}`);
totalValueCell.value = totalWeightPacking;
totalValueCell.font = {
  name: "Calibri",
  bold: true,
};
totalValueCell.alignment = {
  horizontal: "right",
};
totalValueCell.numFmt = "#,##0";

// Marco externo limpio
setOuterBorder(packingSheet, totalsRow, totalsRow, 1, 8);


// 🖼️ LOGO PACKING
try {
  const logoUrl = new URL("/logo.jpeg", req.url).toString();
  const response = await fetch(logoUrl);
  if (response.ok) {
    const arrayBuffer = await response.arrayBuffer();
    const base64Image =
      "data:image/png;base64," + Buffer.from(arrayBuffer).toString("base64");
    const imageId = wb.addImage({ base64: base64Image, extension: "png" });
    packingSheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 128, height: 110 } });
  }
} catch (error) {
  console.log("Logo fetch error:", error);
}

// ============================================================
// ================= INVOICE =================
// ============================================================

// Tamaño carta
invoiceSheet.pageSetup.paperSize = 9;
invoiceSheet.pageSetup.orientation = "portrait";

// 📏 COLUMNAS EXACTAS FORMATO ORIGINAL
invoiceSheet.getColumn("A").width = 4.18;
invoiceSheet.getColumn("B").width = 6.41;
invoiceSheet.getColumn("C").width = 36.86;
invoiceSheet.getColumn("D").width = 4.86;
invoiceSheet.getColumn(5).width = 6.18;
invoiceSheet.getColumn("F").width = 28.86;
invoiceSheet.getColumn("G").width = 6.18;
invoiceSheet.getColumn("H").width = 12.18;

let row = 1;

// 🔹 COLUMN HEADERS (A13:H13)
row = 13;
invoiceSheet.getCell("A13").value = "Boxes";
invoiceSheet.getCell("B13").value = "Pounds";
invoiceSheet.getCell("C13").value = "Description";
invoiceSheet.getCell("D13").value = "Size";
invoiceSheet.getCell("E13").value = "Form";
invoiceSheet.getCell("F13").value = "Scientific Name";
invoiceSheet.getCell("G13").value = "Price";
invoiceSheet.getCell("H13").value = "Amount";

invoiceSheet.getRow(13).height = 40;

for (let col = 1; col <= 8; col++) {
  const cell = invoiceSheet.getCell(13, col);
  cell.font = { bold: true };
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: false };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9EAF7" } };
  cell.border = { bottom: { style: "medium" } };
}

row = 14;

// ============================================================
// 🔹 VENDEDOR (A–D) INVOICE
// ============================================================

safeMerge(invoiceSheet, "A6:D7");
safeMerge(invoiceSheet, "A8:D12");

const invoiceVendorCell = invoiceSheet.getCell("A6");
invoiceVendorCell.value = "SOC. COOP. QUALITY FISH";
invoiceVendorCell.font = {
  name: "Seaford",
  size: 20,
  bold: true,
  color: darkBlueText,
};
invoiceVendorCell.alignment = { horizontal: "center", vertical: "middle" };

const invoiceVendorInfo = invoiceSheet.getCell("A8");
invoiceVendorInfo.value =
  "CALLE 21 S/N X 136 Y 138\nCHELEM, YUCATAN, MEX.\nRFC: QFI221111RI5\nFDA: 1506224494";

invoiceVendorInfo.font = {
  name: "Seaford",
  size: 14,
  bold: true,
  color: accentBlue,
};

invoiceVendorInfo.alignment = {
  wrapText: true,
  vertical: "top",
  horizontal: "left",
};

setOuterBorder(invoiceSheet, 1, 12, 1, 4);

// ============================================================
// 🖼️ LOGO INVOICE (A1:D5)
// ============================================================

try {
  const logoUrl = new URL("/logo.jpeg", req.url).toString();
  const response = await fetch(logoUrl);

  if (response.ok) {
    const arrayBuffer = await response.arrayBuffer();
    const base64Image =
      "data:image/png;base64," +
      Buffer.from(arrayBuffer).toString("base64");

    const imageId = wb.addImage({
      base64: base64Image,
      extension: "png",
    });

    invoiceSheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 128, height: 110 },
    });
  }
} catch (error) {
  console.log("Logo fetch error:", error);
}

// ============================================================
// 🔹 CLIENTE (E–H)
// ============================================================

safeMerge(invoiceSheet, "E1:H3");
safeMerge(invoiceSheet, "E4:H7");

const invoiceClientCell = invoiceSheet.getCell("E1");
invoiceClientCell.value = clientName.toUpperCase();
invoiceClientCell.font = {
  name: "Seaford",
  size: 20,
  bold: true,
  color: darkBlueText,
};
invoiceClientCell.alignment = {
  horizontal: "center",
  vertical: "middle",
};

const invoiceClientAddress = invoiceSheet.getCell("E4");
invoiceClientAddress.value =
  `${clientAddressLine1}\n${clientAddressLine2}`.toUpperCase();

invoiceClientAddress.font = {
  name: "Seaford",
  size: 14,
  bold: true,
  color: accentBlue,
};

invoiceClientAddress.alignment = {
  wrapText: true,
  vertical: "top",
  horizontal: "left",
};

// TAX ID
safeMerge(invoiceSheet, "E8:H8");

const invoiceTaxCell = invoiceSheet.getCell("E8");
invoiceTaxCell.value = `TAX ID # ${clientTaxId}`.toUpperCase();
invoiceTaxCell.font = {
  name: "Seaford",
  size: 14,
  bold: true,
  color: accentBlue,   // 🔵 azul
};
invoiceTaxCell.alignment = {
  horizontal: "left",
  vertical: "middle",
};

setOuterBorder(invoiceSheet, 1, 8, 5, 8);

// ============================================================
// 🔹 AWB (MARCO EXTERNO LIMPIO)
// ============================================================

safeMerge(invoiceSheet, "F9:H9");

invoiceSheet.getCell("E9").value = "AWB";
invoiceSheet.getCell("E9").font = headerFontAWBLabel;

invoiceSheet.getCell("F9").value = packing.guide ?? "";
invoiceSheet.getCell("F9").font = headerFontAWBNumber;
invoiceSheet.getCell("F9").alignment = { horizontal: "right" };

// BORDE EXTERNO REAL
setOuterBorder(invoiceSheet, 9, 9, 5, 8);

// ============================================================
// 🔹 INVOICE NUMBER
// ============================================================

safeMerge(invoiceSheet, "E10:F10");
safeMerge(invoiceSheet, "G10:H10");

invoiceSheet.getCell("E10").value = "INVOICE";
invoiceSheet.getCell("E10").font = headerFontMedium;

invoiceSheet.getCell("G10").value = packing.invoice_no;
invoiceSheet.getCell("G10").font = headerFontMedium;
invoiceSheet.getCell("G10").alignment = {
  horizontal: "right",
};
setOuterBorder(invoiceSheet, 10, 10, 5, 8);

// ============================================================
// 🔹 DATE
// ============================================================

safeMerge(invoiceSheet, "E11:F11");
safeMerge(invoiceSheet, "G11:H11");

invoiceSheet.getCell("E11").value = "DATE";
invoiceSheet.getCell("E11").font = headerFontMedium;

invoiceSheet.getCell("G11").value =
  packing.created_at?.slice(0, 10) ?? "";

invoiceSheet.getCell("G11").font = headerFontMedium;
invoiceSheet.getCell("G11").alignment = {
  horizontal: "right",
};
setOuterBorder(invoiceSheet, 11, 11, 5, 8);

// ============================================================
// 🔹 COUNTRY
// ============================================================

safeMerge(invoiceSheet, "E12:H12");

const invoiceCountryCell = invoiceSheet.getCell("E12");
invoiceCountryCell.value = "COUNTRY OF ORIGIN: MEXICO";
invoiceCountryCell.font = headerFontMedium;
invoiceCountryCell.alignment = {
  horizontal: "left",
};
invoiceCountryCell.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFFF00" },
};

setOuterBorder(invoiceSheet, 12, 12, 5, 8);


// ============================================================
// 🔹 MARCOS Y FONDO
// ============================================================
// Marco vendedor A1:D13
for (let r = 1; r <= 13; r++) {
  for (let c = 1; c <= 8; c++) {
    invoiceSheet.getCell(r, c).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
  }
}

// Marco AWB E9:H9
for (let c = 5; c <= 8; c++) {
  invoiceSheet.getCell(9, c).border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
}

// Fondo blanco header completo
for (let r = 1; r <= 13; r++) {
  for (let c = 1; c <= 8; c++) {
    invoiceSheet.getCell(r, c).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
  }
}

row = 14;

  // ============================================================
// 🔹 AGRUPAR CAJAS PARA FACTURA (RESTORED)
// ============================================================

const invoiceBoxesMap = new Map<
  number,
  { box_no: number; is_combined: boolean; lines: any[]; total_lbs: number }
>();

lines?.forEach((l: any) => {
  if (!invoiceBoxesMap.has(l.box_no)) {
    invoiceBoxesMap.set(l.box_no, {
      box_no: l.box_no,
      is_combined: l.is_combined,
      lines: [l],
      total_lbs: l.pounds,
    });
  } else {
    const box = invoiceBoxesMap.get(l.box_no)!;
    box.lines.push(l);
    box.total_lbs += l.pounds;
  }
});

const simpleMap = new Map<
  string,
  {
    desc: string;
    sci: string;
    size: string;
    form: string;
    boxes: number;
    pounds: number;
    price: number;
  }
>();

const combinedBoxes: any[] = [];

invoiceBoxesMap.forEach((box) => {
  if (box.is_combined) {
    combinedBoxes.push(box);
  } else {
    box.lines.forEach((l: any) => {
      const key = `${l.description_en}|${l.size}|${l.form}|${l.price}`;
      if (!simpleMap.has(key)) {
        simpleMap.set(key, {
          desc: l.description_en,
          sci: l.species?.scientific_name ?? "",
          size: l.size,
          form: l.form,
          boxes: 1,
          pounds: l.pounds,
          price: l.price,
        });
      } else {
        const g = simpleMap.get(key)!;
        g.boxes += 1;
        g.pounds += l.pounds;
      }
    });
  }
});

let totalAmount = 0;
let totalLbs = 0;

// ============================================================
// 🔹 WRITE ROW FUNCTION (A–H CORRECT)
// ============================================================

function writeInvoiceRow(data: {
  boxes?: number | string;
  lbs: number;
  desc: string;
  size: string;
  form: string;
  sci: string;
  price: number;
  amount: number;
}) {
  invoiceSheet.getRow(row).values = [
    data.boxes ?? "",
    data.lbs,
    data.desc,
    data.size,
    data.form,
    data.sci,
    data.price,
    data.amount,
  ];

  invoiceSheet.getCell(`A${row}`).alignment = { horizontal: "center" };
  invoiceSheet.getCell(`B${row}`).alignment = { horizontal: "right" };
  invoiceSheet.getCell(`G${row}`).alignment = { horizontal: "right" };
  invoiceSheet.getCell(`H${row}`).alignment = { horizontal: "right" };

  invoiceSheet.getCell(`B${row}`).numFmt = "#,##0";
  invoiceSheet.getCell(`G${row}`).numFmt = '"$"#,##0.00';
  invoiceSheet.getCell(`H${row}`).numFmt = '"$"#,##0.00';

  row++;
}

// ============================================================
// 🔹 SIMPLES AGRUPADOS
// ============================================================

simpleMap.forEach((g) => {
  const amount = g.pounds * g.price;
  totalAmount += amount;
  totalLbs += g.pounds;

  writeInvoiceRow({
    boxes: g.boxes,
    lbs: g.pounds,
    desc: g.desc,
    size: g.size,
    form: g.form,
    sci: g.sci,
    price: g.price,
    amount,
  });
});

// ============================================================
// 🔹 COMBINADAS (BOX BY BOX)
// ============================================================

combinedBoxes.forEach((box) => {
  box.lines.forEach((l: any, index: number) => {
    const amount = l.pounds * l.price;
    totalAmount += amount;
    totalLbs += l.pounds;

    writeInvoiceRow({
      boxes: index === 0 ? 1 : "",
      lbs: l.pounds,
      desc: l.description_en,
      size: l.size,
      form: l.form,
      sci: l.species?.scientific_name ?? "",
      price: l.price,
      amount,
    });
  });
});

// ============================================================
// 🔹 SMALL / LARGE BOXES
// ============================================================

let smallBoxes = 0;
let largeBoxes = 0;

invoiceBoxesMap.forEach((b) => {
  if (b.total_lbs < 70) smallBoxes++;
  else largeBoxes++;
});
const totalBoxes = invoiceBoxesMap.size;

  // ============================================================
  // 📊 BLOQUE FINAL
  // ============================================================

  invoiceSheet.getRow(49).height = 6;

  invoiceSheet.getCell("A50").value = totalBoxes;
  invoiceSheet.getCell("B50").value = totalLbs;
  invoiceSheet.getCell("B50").numFmt = "#,##0";
  invoiceSheet.getCell("C50").value = "LBS";
  

  invoiceSheet.mergeCells("G50:H50");
  invoiceSheet.getCell("G50").value = totalAmount;
  invoiceSheet.getCell("G50").numFmt = '"$"#,##0.00';
  const row50 = invoiceSheet.getRow(50);

row50.font = {
  name: "seaford",
  bold: true,
};
setOuterBorder(invoiceSheet, 50, 50, 1, 8);

for (let r = 13; r <= 49; r++) {
  for (let c = 1; c <= 8; c++) {
    const cell = invoiceSheet.getCell(r, c);

    // fondo azul muy claro
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF2F8FF" }, // azul claro
    };

    // líneas internas azul suave
    cell.border = {
      top: { style: "thin", color: { argb: "FFB7D7F0" } },
      left: { style: "thin", color: { argb: "FFB7D7F0" } },
      bottom: { style: "thin", color: { argb: "FFB7D7F0" } },
      right: { style: "thin", color: { argb: "FFB7D7F0" } },
    };
  }
}

setOuterBorder(invoiceSheet, 13, 50, 1, 8);

  invoiceSheet.mergeCells("G52:H52");

const cell52 = invoiceSheet.getCell("G52");

cell52.value = totalAmount;
cell52.numFmt = '"$"#,##0.00';

cell52.font = {
  name: "Seaford",
  bold: true,
};

cell52.alignment = {
  horizontal: "right",
  vertical: "middle",
};

// 🔹 BORDE SOLO EN G52:H52
invoiceSheet.getCell("G52").border = {
  top: { style: "thin" },
  left: { style: "thin" },
  bottom: { style: "thin" },
};

invoiceSheet.getCell("H52").border = {
  top: { style: "thin" },
  right: { style: "thin" },
  bottom: { style: "thin" },
};


 // ============================================================
// FILA 53 – MONTO EN LETRAS
// ============================================================

invoiceSheet.mergeCells("A53:H53");

const row53 = invoiceSheet.getRow(53);
const cell53 = invoiceSheet.getCell("A53");

cell53.value = formatAmountInWords(totalAmount);

cell53.alignment = {
  horizontal: "center",
  vertical: "middle",
  wrapText: true,
};

cell53.font = {
  name: "Seaford",
  bold: true,
  size: 14,
};

// 🔹 cálculo altura
const text = cell53.value?.toString() ?? "";
const approxLines = Math.ceil(text.length / 45);
row53.height = Math.max(30, 22 * approxLines);

// 🔹 Borde externo
setOuterBorder(invoiceSheet, 53, 53, 1, 8);

// 🔹 BORDE DOBLE INFERIOR FILA 53
for (let c = 1; c <= 8; c++) {
  invoiceSheet.getCell(53, c).border = {
    ...invoiceSheet.getCell(53, c).border,
    bottom: { style: "double" },
  };
}

// ============================================================
// FILA 54 – SIN BORDES
// ============================================================

invoiceSheet.getCell("B54").value = largeBoxes;
invoiceSheet.getCell("C54").value = "BOXES 110 LBS";

for (let c = 1; c <= 8; c++) {
  invoiceSheet.getCell(54, c).border = {};
}

// ============================================================
// FILA 55 – DOBLE BORDE INFERIOR
// ============================================================

invoiceSheet.getCell("B55").value = smallBoxes;
invoiceSheet.getCell("C55").value = "BOXES 55 LBS";

for (let c = 2; c <= 3; c++) {
  invoiceSheet.getCell(55, c).border = {
    bottom: { style: "double" },
  };
}

// ============================================================
// FILA 56 – SIN BORDES
// ============================================================


invoiceSheet.getCell("C56").value = "TOTAL BOXES";

for (let c = 1; c <= 8; c++) {
  invoiceSheet.getCell(56, c).border = {};
}

 // ============================================================
// EXPORT
// ============================================================

const safeClient =
  clientName?.toUpperCase().replace(/[^A-Z0-9]/g, "_") || "CLIENT";

const filename = `Packing_Invoice_${safeClient}_${packing.invoice_no}.xlsx`;

const buffer = await wb.xlsx.writeBuffer();

return new NextResponse(buffer, {
  headers: {
    "Content-Type":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${filename}"`,
  },
});
}
