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
  // 🟩 INVOICE SHEET (FORMATO REAL)
  // ============================================================
  const invoiceSheet = wb.addWorksheet("Invoice");

  let row = 1;

  // 🔹 ENCABEZADO SUPERIOR
  invoiceSheet.getCell(`A${row}`).value = `CLIENT: ${clientName}`; row++;
  invoiceSheet.getCell(`A${row}`).value = `INVOICE NO: ${packing.invoice_no}`; row++;
  invoiceSheet.getCell(`A${row}`).value = `DATE: ${packing.created_at?.slice(0, 10)}`; row++;
  invoiceSheet.getCell(`A${row}`).value = `COUNTRY OF ORIGIN: MEXICO`; row++;
  invoiceSheet.getCell(`A${row}`).value = `PO NUMBER: __________________________`; row += 2;

  // 🔹 HEADERS MANUALES
  invoiceSheet.getRow(row).values = [
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
  invoiceSheet.getRow(row).font = { bold: true };
  invoiceSheet.getRow(row).alignment = { vertical: "middle" };
  row++;

  // Agrupar por caja
  const invoiceBoxesMap = new Map<number, any>();
  lines?.forEach((l: any) => {
    if (!invoiceBoxesMap.has(l.box_no)) {
      invoiceBoxesMap.set(l.box_no, {
        box_no: l.box_no,
        is_combined: l.is_combined,
        lines: [l],
      });
    } else {
      invoiceBoxesMap.get(l.box_no).lines.push(l);
    }
  });

  const simpleMap = new Map<string, any>();
  const combinedBoxes: any[] = [];

  invoiceBoxesMap.forEach((box) => {
    if (box.is_combined) {
      combinedBoxes.push(box);
    } else {
      box.lines.forEach((l: any) => {
        const key = `${l.description_en}|${l.size}|${l.form}`;
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
          const g = simpleMap.get(key);
          g.boxes += 1;
          g.pounds += l.pounds;
        }
      });
    }
  });

  let totalAmount = 0;
  let totalLbs = 0;

  function writeInvoiceRow(data: any) {
    invoiceSheet.getRow(row).values = [
      "",
      data.boxes ?? "",
      data.lbs,
      data.desc,
      data.size,
      data.form,
      data.sci,
      data.price,
      data.amount,
    ];
    invoiceSheet.getCell(`B${row}`).alignment = { horizontal: "center" };
    invoiceSheet.getCell(`C${row}`).alignment = { horizontal: "right" };
    invoiceSheet.getCell(`H${row}`).alignment = { horizontal: "right" };
    invoiceSheet.getCell(`I${row}`).alignment = { horizontal: "right" };
    invoiceSheet.getCell(`C${row}`).numFmt = "0.00";
    invoiceSheet.getCell(`H${row}`).numFmt = "0.00";
    invoiceSheet.getCell(`I${row}`).numFmt = "0.00";
    row++;
  }

  // 🔹 SIMPLES AGRUPADAS
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

  // 🔹 COMBINADAS EXACTAS
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

  // 🔹 TOTALES
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

boxes.forEach((b) => {
  if (b.total_lbs < 70) smallBoxes++;
  else largeBoxes++;
});

invoiceSheet.getCell(`A${row}`).value = `Small Boxes: ${smallBoxes}`;
row++;
invoiceSheet.getCell(`A${row}`).value = `Large Boxes: ${largeBoxes}`;
row++;
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