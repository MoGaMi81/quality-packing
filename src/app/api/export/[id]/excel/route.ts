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
// 🧾 INVOICE HEADER – FORMATO SEA LION DEFINITIVO
// ============================================================

const invoiceSheet = wb.addWorksheet("Invoice");

// Tamaño carta
invoiceSheet.pageSetup.paperSize = 9;
invoiceSheet.pageSetup.orientation = "portrait";

// ============================================================
// 📏 COLUMNAS EXACTAS FORMATO ORIGINAL
// ============================================================

invoiceSheet.getColumn("A").width = 4.18;
invoiceSheet.getColumn("B").width = 6.41;
invoiceSheet.getColumn("C").width = 36.86;
invoiceSheet.getColumn("D").width = 4.86;
invoiceSheet.getColumn("E").width = 6.18;
invoiceSheet.getColumn("F").width = 28.86;
invoiceSheet.getColumn("G").width = 6.18;
invoiceSheet.getColumn("H").width = 12.18;

let row = 1;

// ============================================================
// 🔹 VENDEDOR (A–D)
// ============================================================

// 1A:5D → Espacio Logo
invoiceSheet.mergeCells("A1:D5");

// 6A:7D → Nombre
invoiceSheet.mergeCells("A6:D7");
invoiceSheet.getCell("A6").value = "SOC. COOP. QUALITY FISH";
invoiceSheet.getCell("A6").font = { size: 18, bold: true };
invoiceSheet.getCell("A6").alignment = { vertical: "middle" };

// 8A:12D → Dirección
invoiceSheet.mergeCells("A8:D12");
invoiceSheet.getCell("A8").value =
  "CALLE 21 S/N X 136 Y 138\nCHELEM, YUCATAN, MEX.\nRFC: QFI221111RI5\nFDA: 1506224494";
invoiceSheet.getCell("A8").alignment = {
  wrapText: true,
  vertical: "top",
};

// ============================================================
// 🔹 CLIENTE (E–H)
// ============================================================

const dateFormatted = packing.created_at?.slice(0, 10) ?? "";

// 1E:3H → Cliente
invoiceSheet.mergeCells("E1:H3");
invoiceSheet.getCell("E1").value = clientName.toUpperCase();
invoiceSheet.getCell("E1").font = { size: 20, bold: true };
invoiceSheet.getCell("E1").alignment = {
  horizontal: "center",
  vertical: "middle",
};

// 4E:7H → Dirección cliente
invoiceSheet.mergeCells("E4:H7");
invoiceSheet.getCell("E4").value =
  "2000 BANKS ROAD SUITE 222\nMARGATE, FL 33063";
invoiceSheet.getCell("E4").alignment = {
  wrapText: true,
  vertical: "top",
};

// 8E → TAX ID
invoiceSheet.getCell("E8").value = "TAX ID # 954376601";

// 9E → AWB
invoiceSheet.getCell("E9").value = `AWB: ${packing.guide ?? ""}`;

// 10E → INVOICE
invoiceSheet.getCell("E10").value = `INVOICE: ${packing.invoice_no}`;

// 11E → DATE
invoiceSheet.getCell("E11").value = `DATE: ${dateFormatted}`;

// 12E:12H → COUNTRY OF ORIGIN (SOLO MITAD DERECHA)
invoiceSheet.mergeCells("E12:H12");
invoiceSheet.getCell("E12").value = "COUNTRY OF ORIGIN: MEXICO";
invoiceSheet.getCell("E12").alignment = {
  horizontal: "center",
  vertical: "middle",
};
invoiceSheet.getCell("E12").font = { bold: true };
invoiceSheet.getCell("E12").fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFFFFF00" },
};

// ============================================================
// 📐 ALTURA EXACTA SEGÚN FORMATO
// ============================================================

// 1–7 → 15
for (let r = 1; r <= 7; r++) {
  invoiceSheet.getRow(r).height = 15;
}

// 8–9 → 24
for (let r = 8; r <= 9; r++) {
  invoiceSheet.getRow(r).height = 24;
}

// 10–12 → 16
for (let r = 10; r <= 12; r++) {
  invoiceSheet.getRow(r).height = 16;
}

// Línea divisoria vertical entre vendedor y cliente
for (let r = 1; r <= 12; r++) {
  invoiceSheet.getCell(r, 4).border = {
    right: { style: "medium" },
  };
}

row = 14;


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

      // ============================================================
// 📊 BLOQUE FINAL EXACTO FORMATO ORIGINAL
// ============================================================

// 50A → total cajas
invoiceSheet.getCell("A50").value = boxes.length;

// 50B → total lbs
invoiceSheet.getCell("B50").value = totalLbs;
invoiceSheet.getCell("B50").numFmt = "#,##0.00";

// 50C → LBS
invoiceSheet.getCell("C50").value = "LBS";

// 50G-50H → total dólares
invoiceSheet.mergeCells("G50:H50");
invoiceSheet.getCell("G50").value = totalAmount;
invoiceSheet.getCell("G50").numFmt = '"$"#,##0.00';

// 52G-52H → repetir total dólares
invoiceSheet.mergeCells("G52:H52");
invoiceSheet.getCell("G52").value = totalAmount;
invoiceSheet.getCell("G52").numFmt = '"$"#,##0.00';

// 53A-53H → dólares en letras (temporal)
invoiceSheet.mergeCells("A53:H53");
invoiceSheet.getCell("A53").value = `$ ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
invoiceSheet.getCell("A53").font = { italic: true };

 // 🔹 SMALL / LARGE
  let smallBoxes = 0;
  let largeBoxes = 0;

  boxes.forEach((b: any) => {
    if (b.total_lbs < 70) smallBoxes++;
    else largeBoxes++;
  });

// 54B → cajas grandes (110)
invoiceSheet.getCell("B54").value = largeBoxes;

// 54C → texto grandes
invoiceSheet.getCell("C54").value = "BOXES 110 LBS";

// 55B → cajas chicas (55)
invoiceSheet.getCell("B55").value = smallBoxes;

// 55C → texto chicas
invoiceSheet.getCell("C55").value = "BOXES 55 LBS";

// 57B → total cajas general
invoiceSheet.getCell("B57").value = boxes.length;

// 57C → texto total
invoiceSheet.getCell("C57").value = "TOTAL BOXES";

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