import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  // ==============================
  // 1️⃣ HEADER
  // ==============================
  const { data: packing, error: e1 } = await supabase
    .from("packings")
    .select(`
      id,
      invoice_no,
      guide,
      clients ( name ),
      created_at
    `)
    .eq("id", params.id)
    .single();

  if (e1 || !packing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const clientName = (packing.clients as any)?.name ?? "";

  // ==============================
  // 2️⃣ LINES + SCIENTIFIC NAME
  // ==============================
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

  const wb = new ExcelJS.Workbook();

  // ============================================================
  // 🟦 PACKING SHEET
  // ============================================================
  const packingSheet = wb.addWorksheet("Packing");

  packingSheet.addRow([`CLIENT: ${clientName}`]);
  packingSheet.addRow([`INVOICE NO: ${packing.invoice_no}`]);
  packingSheet.addRow([`DATE: ${packing.created_at?.slice(0, 10)}`]);
  packingSheet.addRow([]);

  packingSheet.columns = [
    { header: "Box No.", key: "box", width: 10 },
    { header: "Item Name", key: "desc", width: 30 },
    { header: "Form", key: "form", width: 10 },
    { header: "Size", key: "size", width: 12 },
    { header: "Box Weight (lbs)", key: "lbs", width: 18 },
  ];

  // Agrupar cajas reales
  const boxesMap = new Map<number, any>();
  lines?.forEach((l: any) => {
    if (!boxesMap.has(l.box_no)) {
      boxesMap.set(l.box_no, {
        box_no: l.box_no,
        total_lbs: l.pounds,
        lines: [l],
      });
    } else {
      const b = boxesMap.get(l.box_no);
      b.total_lbs += l.pounds;
      b.lines.push(l);
    }
  });

  const boxes = Array.from(boxesMap.values());

  boxes.forEach((b) => {
    b.lines.forEach((l: any) => {
      packingSheet.addRow({
        box: b.box_no,
        desc: l.description_en,
        form: l.form,
        size: l.size,
        lbs: l.pounds,
      });
    });
  });

  packingSheet.addRow([]);
  packingSheet.addRow([`Total Boxes: ${boxes.length}`]);
  packingSheet.addRow([
    `Total Pounds: ${boxes.reduce((s, b) => s + b.total_lbs, 0).toFixed(2)}`,
  ]);

// ============================================================
// 🧾 INVOICE HEADER – FORMATO SEA LION REAL CORREGIDO
// ============================================================

const invoiceSheet = wb.addWorksheet("Invoice");

// Tamaño carta
invoiceSheet.pageSetup.paperSize = 9;
invoiceSheet.pageSetup.orientation = "portrait";

// Columnas A–H para header dividido
for (let i = 1; i <= 8; i++) {
  invoiceSheet.getColumn(i).width = 18;
}

let row = 1;

// ============================================================
// 🔹 VENDEDOR (A–D)
// ============================================================

// 1A:5D → espacio logo
invoiceSheet.mergeCells("A1:D5");

// 6A:7D → Nombre
invoiceSheet.mergeCells("A6:D7");
invoiceSheet.getCell("A6").value = "SOC. COOP. QUALITY FISH";
invoiceSheet.getCell("A6").font = { size: 18, bold: true };

// 8A:12D → Dirección + RFC + FDA
invoiceSheet.mergeCells("A8:D12");
invoiceSheet.getCell("A8").value =
  "CALLE 21 S/N X 136 Y 138\nCHELEM, YUCATAN, MEX.\nRFC: QFI221111RI5\nFDA: 1506224494";
invoiceSheet.getCell("A8").alignment = { wrapText: true };

// ============================================================
// 🔹 CLIENTE (E–H)
// ============================================================

const dateFormatted = packing.created_at?.slice(0, 10) ?? "";

// 1E:3H → Cliente
invoiceSheet.mergeCells("E1:H3");
invoiceSheet.getCell("E1").value = clientName.toUpperCase();
invoiceSheet.getCell("E1").font = { size: 20, bold: true };
invoiceSheet.getCell("E1").alignment = { horizontal: "center", vertical: "middle" };

// 4E:7H → Dirección cliente (temporal fija)
invoiceSheet.mergeCells("E4:H7");
invoiceSheet.getCell("E4").value =
  "2000 BANKS ROAD SUITE 222\nMARGATE, FL 33063";
invoiceSheet.getCell("E4").alignment = { wrapText: true };

// 8E:8H → TAX ID
invoiceSheet.mergeCells("E8:H8");
invoiceSheet.getCell("E8").value = "TAX ID # 954376601";

// 9E:9H → AWB
invoiceSheet.mergeCells("E9:H9");
invoiceSheet.getCell("E9").value = `AWB: ${packing.guide ?? ""}`;

// 10E:10H → INVOICE
invoiceSheet.mergeCells("E10:H10");
invoiceSheet.getCell("E10").value = `INVOICE: ${packing.invoice_no}`;

// 11E:11H → DATE
invoiceSheet.mergeCells("E11:H11");
invoiceSheet.getCell("E11").value = `DATE: ${dateFormatted}`;

// 12E:12H → COUNTRY
invoiceSheet.mergeCells("E12:H12");
invoiceSheet.getCell("E12").value = "COUNTRY OF ORIGIN: MEXICO";
invoiceSheet.getCell("E12").alignment = { horizontal: "center" };
invoiceSheet.getCell("E12").font = { bold: true };
invoiceSheet.getCell("E12").fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFFF00" },
};

// ============================================================
// 🔹 LÍNEA DIVISORIA CENTRAL ENTRE A–D y E–H
// ============================================================

for (let r = 1; r <= 12; r++) {
  invoiceSheet.getCell(r, 4).border = {
    right: { style: "medium" },
  };
}

row = 14;

// Línea divisoria vertical
invoiceSheet.getColumn(5).border = {
  left: { style: "medium" }
};

// 🔹 COUNTRY OF ORIGIN (SOLO MITAD DERECHA)
invoiceSheet.mergeCells("F9:I9");

invoiceSheet.getCell("F9").value = "COUNTRY OF ORIGIN: MEXICO";

invoiceSheet.getCell("F9").alignment = {
  horizontal: "center",
  vertical: "middle",
};

invoiceSheet.getCell("F9").font = {
  bold: true,
  size: 12,
};

invoiceSheet.getCell("F9").fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFFF00" },
};

invoiceSheet.getRow(9).height = 22;

row = 12;

// ============================================================
// 🔹 COLUMN HEADERS
// ============================================================
const headerRow = invoiceSheet.getRow(row);
headerRow.values = [
  "",
  "Boxes",
  "Pounds",
  "Description",
  "Size",
  "Form",
  "Scientific Name",
  "Price",
  "Amount",
];

headerRow.font = { bold: true };
headerRow.alignment = { vertical: "middle" };

// Línea inferior estilo profesional
headerRow.eachCell((cell) => {
  cell.border = {
    bottom: { style: "medium" },
  };
});

row++;

  // 🔹 AGRUPAR CAJAS PARA FACTURA
  const invoiceBoxesMap = new Map<number, { box_no: number; is_combined: boolean; lines: any[] }>();
  lines?.forEach((l: any) => {
    if (!invoiceBoxesMap.has(l.box_no)) {
      invoiceBoxesMap.set(l.box_no, { box_no: l.box_no, is_combined: l.is_combined, lines: [l] });
    } else {
      invoiceBoxesMap.get(l.box_no)!.lines.push(l);
    }
  });

  const simpleMap = new Map<string, { desc: string; sci: string; size: string; form: string; boxes: number; pounds: number; price: number }>();
  const combinedBoxes: { box_no: number; is_combined: boolean; lines: any[] }[] = [];

  invoiceBoxesMap.forEach((box) => {
    if (box.is_combined) {
      combinedBoxes.push(box);
    } else {
      box.lines.forEach((l: any) => {
        const key = `${l.description_en}|${l.size}|${l.form}`;
        if (!simpleMap.has(key)) {
          simpleMap.set(key, { desc: l.description_en, sci: l.species?.scientific_name ?? "", size: l.size, form: l.form, boxes: 1, pounds: l.pounds, price: l.price });
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

  function writeInvoiceRow(data: { boxes?: number | string; lbs: number; desc: string; size: string; form: string; sci: string; price: number; amount: number }) {
    invoiceSheet.getRow(row).values = ["", data.boxes ?? "", data.lbs, data.desc, data.size, data.form, data.sci, data.price, data.amount];
    invoiceSheet.getCell(`B${row}`).alignment = { horizontal: "center" };
    invoiceSheet.getCell(`C${row}`).alignment = { horizontal: "right" };
    invoiceSheet.getCell(`H${row}`).alignment = { horizontal: "right" };
    invoiceSheet.getCell(`I${row}`).alignment = { horizontal: "right" };
    invoiceSheet.getCell(`C${row}`).numFmt = "0.00";
    invoiceSheet.getCell(`H${row}`).numFmt = "0.00";
    invoiceSheet.getCell(`I${row}`).numFmt = "0.00";
    row++;
  }

  // 🔹 SIMPLES
  simpleMap.forEach((g) => {
    const amount = g.pounds * g.price;
    totalAmount += amount;
    totalLbs += g.pounds;
    writeInvoiceRow({ boxes: g.boxes, lbs: g.pounds, desc: g.desc, size: g.size, form: g.form, sci: g.sci, price: g.price, amount });
  });

  // 🔹 COMBINADAS
  combinedBoxes.forEach((box) => {
    box.lines.forEach((l: any, index: number) => {
      const amount = l.pounds * l.price;
      totalAmount += amount;
      totalLbs += l.pounds;
      writeInvoiceRow({ boxes: index === 0 ? 1 : "", lbs: l.pounds, desc: l.description_en, size: l.size, form: l.form, sci: l.species?.scientific_name ?? "", price: l.price, amount });
    });
    });

      // 🔹 TOTAL
  row++;

  invoiceSheet.getCell(`F${row}`).value = "TOTAL";
  invoiceSheet.getCell(`F${row}`).font = { bold: true };

  invoiceSheet.getCell(`C${row}`).value = totalLbs;
  invoiceSheet.getCell(`I${row}`).value = totalAmount;

  invoiceSheet.getCell(`C${row}`).numFmt = "0.00";
  invoiceSheet.getCell(`I${row}`).numFmt = "0.00";
  invoiceSheet.getCell(`C${row}`).font = { bold: true };
  invoiceSheet.getCell(`I${row}`).font = { bold: true };

  row += 2;

  // 🔹 SMALL / LARGE
  let smallBoxes = 0;
  let largeBoxes = 0;

  boxes.forEach((b: any) => {
    if (b.total_lbs < 70) smallBoxes++;
    else largeBoxes++;
  });

  invoiceSheet.getCell(`A${row}`).value = `Small Boxes: ${smallBoxes}`; row++;
  invoiceSheet.getCell(`A${row}`).value = `Large Boxes: ${largeBoxes}`; row++;
  invoiceSheet.getCell(`A${row}`).value = `Total Boxes: ${boxes.length}`;

  // ============================================================
  // 📁 EXPORT
  // ============================================================
  const buffer = await wb.xlsx.writeBuffer();
  const filename = `Packing_Invoice ${clientName} ${packing.invoice_no}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}