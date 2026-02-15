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
// 🟩 INVOICE SHEET (FORMATO MEJORADO – SEGURO)
// ============================================================
const invoiceSheet = wb.addWorksheet("Invoice");

// 🔹 Column widths manual (seguro para TS)
invoiceSheet.getColumn(1).width = 2;
invoiceSheet.getColumn(2).width = 10;
invoiceSheet.getColumn(3).width = 14;
invoiceSheet.getColumn(4).width = 30;
invoiceSheet.getColumn(5).width = 12;
invoiceSheet.getColumn(6).width = 12;
invoiceSheet.getColumn(7).width = 22;
invoiceSheet.getColumn(8).width = 12;
invoiceSheet.getColumn(9).width = 14;

let row = 1;

// ============================================================
// 🧾 HEADER PROFESIONAL (SIN TOCAR LÓGICA)
// ============================================================

// 🔹 VENDEDOR
invoiceSheet.mergeCells("A1:E1");
invoiceSheet.getCell("A1").value = "SOC. COOP. QUALITY FISH";
invoiceSheet.getCell("A1").font = { size: 14, bold: true };

invoiceSheet.mergeCells("A2:E2");
invoiceSheet.getCell("A2").value = "CALLE 21 S/N X 136 Y 138";

invoiceSheet.mergeCells("A3:E3");
invoiceSheet.getCell("A3").value = "CHELEM, YUCATAN, MEX.";

invoiceSheet.mergeCells("A4:E4");
invoiceSheet.getCell("A4").value = "RFC: QFI221111RI5";

invoiceSheet.mergeCells("A5:E5");
invoiceSheet.getCell("A5").value = "FDA: 1506224494";

// 🔹 CLIENTE
invoiceSheet.mergeCells("F1:I1");
invoiceSheet.getCell("F1").value = String(clientName).toUpperCase();
invoiceSheet.getCell("F1").font = { size: 16, bold: true };
invoiceSheet.getCell("F1").alignment = { horizontal: "center" };

// 🔹 DATOS FACTURA
invoiceSheet.getCell("F3").value = "INVOICE:";
invoiceSheet.getCell("G3").value = packing.invoice_no;

invoiceSheet.getCell("F4").value = "DATE:";
invoiceSheet.getCell("G4").value = packing.created_at?.slice(0, 10);

// 🔹 COUNTRY
invoiceSheet.mergeCells("A7:I7");
invoiceSheet.getCell("A7").value = "COUNTRY OF ORIGIN: MEXICO";
invoiceSheet.getCell("A7").alignment = { horizontal: "center" };
invoiceSheet.getCell("A7").font = { bold: true };
invoiceSheet.getCell("A7").fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFFF00" },
};

row = 9;

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