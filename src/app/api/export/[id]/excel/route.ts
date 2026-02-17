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

  // ============================================================
  // 🧾 INVOICE
  // ============================================================

  const invoiceSheet = wb.addWorksheet("Invoice");

  invoiceSheet.pageSetup.paperSize = 9;
  invoiceSheet.pageSetup.orientation = "portrait";

  // Columnas exactas
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
  // 🔹 VENDEDOR
  // ============================================================

  invoiceSheet.mergeCells("A1:D5");

  invoiceSheet.mergeCells("A6:D7");
  invoiceSheet.getCell("A6").value = "SOC. COOP. QUALITY FISH";
  invoiceSheet.getCell("A6").font = { size: 20, bold: true };

  invoiceSheet.mergeCells("A8:D12");
  invoiceSheet.getCell("A8").value =
    "CALLE 21 S/N X 136 Y 138\nCHELEM, YUCATAN, MEX.\nRFC: QFI221111RI5\nFDA: 1506224494";
  invoiceSheet.getCell("A8").alignment = { wrapText: true };

  // ============================================================
  // 🔹 CLIENTE
  // ============================================================

  const dateFormatted = packing.created_at?.slice(0, 10) ?? "";

  invoiceSheet.mergeCells("E1:H3");
  invoiceSheet.getCell("E1").value = clientName.toUpperCase();
  invoiceSheet.getCell("E1").font = { size: 22, bold: true };
  invoiceSheet.getCell("E1").alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  invoiceSheet.mergeCells("E4:H7");
  invoiceSheet.getCell("E4").value =
    `${clientAddressLine1}\n${clientAddressLine2}`;
  invoiceSheet.getCell("E4").alignment = {
    wrapText: true,
    vertical: "top",
    horizontal: "center",
  };

  invoiceSheet.getCell("E8").value = `TAX ID # ${clientTaxId}`;
  invoiceSheet.getCell("E9").value = `AWB: ${packing.guide ?? ""}`;
  invoiceSheet.getCell("E10").value = `INVOICE: ${packing.invoice_no}`;
  invoiceSheet.getCell("E11").value = `DATE: ${dateFormatted}`;

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
  // 🔹 HEADERS A14:H14
  // ============================================================

  row = 14;

  invoiceSheet.getRow(row).values = [
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
  invoiceSheet.getRow(row).alignment = { horizontal: "center" };

  row++;

  // ============================================================
  // 🔹 DATOS
  // ============================================================

  let totalAmount = 0;
  let totalLbs = 0;

  lines?.forEach((l: any) => {
    const amount = l.pounds * l.price;
    totalAmount += amount;
    totalLbs += l.pounds;

    invoiceSheet.getRow(row).values = [
      1,
      l.pounds,
      l.description_en,
      l.size,
      l.form,
      l.species?.scientific_name ?? "",
      l.price,
      amount,
    ];

    invoiceSheet.getCell(`B${row}`).numFmt = "#,##0.00";
    invoiceSheet.getCell(`G${row}`).numFmt = '"$"#,##0.00';
    invoiceSheet.getCell(`H${row}`).numFmt = '"$"#,##0.00';

    row++;
  });

  // ============================================================
  // 📊 BLOQUE FINAL
  // ============================================================

  invoiceSheet.getCell("A50").value = boxes.length;
  invoiceSheet.getCell("B50").value = totalLbs;
  invoiceSheet.getCell("B50").numFmt = "#,##0.00";
  invoiceSheet.getCell("C50").value = "LBS";

  invoiceSheet.mergeCells("G50:H50");
  invoiceSheet.getCell("G50").value = totalAmount;
  invoiceSheet.getCell("G50").numFmt = '"$"#,##0.00';

  invoiceSheet.mergeCells("G52:H52");
  invoiceSheet.getCell("G52").value = totalAmount;
  invoiceSheet.getCell("G52").numFmt = '"$"#,##0.00';

  invoiceSheet.mergeCells("A53:H53");
  invoiceSheet.getCell("A53").value =
    `$ ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  // ============================================================
  // EXPORT
  // ============================================================

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Packing_Invoice_${packing.invoice_no}.xlsx"`,
    },
  });
}
