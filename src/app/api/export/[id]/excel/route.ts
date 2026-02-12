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
      client_code,
      clients ( name ),
      created_at
    `)
    .eq("id", params.id)
    .single();

  if (e1 || !packing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // ==============================
  // 2️⃣ LINES + SCIENTIFIC NAME
  // ==============================
  const { data: lines, error: e2 } = await supabase
    .from("packing_lines")
    .select(`
      box_no,
      code,
      description_en,
      size,
      form,
      pounds,
      price,
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
  // 🟦 PACKING SHEET (FÍSICO)
  // ============================================================
  const packingSheet = wb.addWorksheet("Packing");

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

  // ============================================================
  // 🟩 INVOICE SHEET (COMERCIAL)
  // ============================================================
  const invoiceSheet = wb.addWorksheet("Invoice");

  // Encabezado superior
  invoiceSheet.addRow([`CLIENT: ${packing.clients?.[0]?.name ?? ""}`]);
  invoiceSheet.addRow([`INVOICE NO: ${packing.invoice_no}`]);
  invoiceSheet.addRow([`DATE: ${packing.created_at?.slice(0, 10)}`]);
  invoiceSheet.addRow([`COUNTRY OF ORIGIN: MEXICO`]);
  invoiceSheet.addRow([`PO NUMBER: __________________`]);
  invoiceSheet.addRow([]);

  invoiceSheet.columns = [
    { header: "Boxes", key: "boxes", width: 10 },
    { header: "Pounds", key: "lbs", width: 12 },
    { header: "Description", key: "desc", width: 30 },
    { header: "Size", key: "size", width: 12 },
    { header: "Form", key: "form", width: 10 },
    { header: "Scientific Name", key: "sci", width: 22 },
    { header: "Price", key: "price", width: 10 },
    { header: "Amount", key: "amount", width: 14 },
  ];

  // Agrupar por producto (NO por caja)
  const productMap = new Map<string, any>();

  lines?.forEach((l: any) => {
    const key = `${l.code}|${l.size}|${l.form}`;

    if (!productMap.has(key)) {
      productMap.set(key, {
        desc: l.description_en,
        sci: l.species?.scientific_name ?? "",
        size: l.size,
        form: l.form,
        boxes: 1,
        pounds: l.pounds,
        price: l.price,
      });
    } else {
      const g = productMap.get(key);
      g.boxes += 1;
      g.pounds += l.pounds;
    }
  });

  let totalAmount = 0;
  let totalLbs = 0;

  productMap.forEach((g) => {
    const amount = g.pounds * g.price;
    totalAmount += amount;
    totalLbs += g.pounds;

    invoiceSheet.addRow({
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

  invoiceSheet.addRow([]);
  invoiceSheet.addRow({
    desc: "TOTAL",
    lbs: totalLbs,
    amount: totalAmount,
  });

  // ============================================================
  // 📦 SMALL / LARGE BOXES (solo resultado final)
  // ============================================================
  let smallBoxes = 0;
  let largeBoxes = 0;

  boxes.forEach((b) => {
    if (b.total_lbs < 70) smallBoxes++;
    else largeBoxes++;
  });

  invoiceSheet.addRow([]);
  invoiceSheet.addRow({ desc: "Small Boxes", boxes: smallBoxes });
  invoiceSheet.addRow({ desc: "Large Boxes", boxes: largeBoxes });
  invoiceSheet.addRow({ desc: "Total Boxes", boxes: boxes.length });

  // ============================================================
  // 📁 EXPORT
  // ============================================================
  const buffer = await wb.xlsx.writeBuffer();

  const filename = `Packing_Invoice ${packing.clients?.[0]?.name ?? ""} ${packing.invoice_no}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
