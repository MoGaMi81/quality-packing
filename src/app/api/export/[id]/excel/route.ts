import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==============================
// Helpers
// ==============================

function isSeaLion(clientCode: string) {
  return clientCode?.toUpperCase() === "SL";
}

// ==============================
// Sheet: INVOICE (GENERAL)
// ==============================

function buildInvoiceSheet(
  wb: ExcelJS.Workbook,
  header: any,
  lines: any[]
) {
  const ws = wb.addWorksheet("Invoice");

  ws.columns = [
    { header: "Boxes", key: "boxes", width: 10 },
    { header: "Pounds", key: "lbs", width: 12 },
    { header: "Description", key: "desc", width: 30 },
    { header: "Size", key: "size", width: 12 },
    { header: "Form", key: "form", width: 10 },
    { header: "Scientific Name", key: "sci", width: 22 },
    { header: "Price", key: "price", width: 10 },
    { header: "Amount", key: "amount", width: 14 },
  ];

  const map = new Map<string, any>();

  lines.forEach((l) => {
    const key = `${l.pricing_key}|${l.size}|${l.form}`;

    if (!map.has(key)) {
      map.set(key, {
        desc: l.species_name,
        size: l.size,
        form: l.form,
        boxes: 1,
        lbs: l.lbs,
        price: l.price,
      });
    } else {
      const g = map.get(key);
      g.boxes += 1;
      g.lbs += l.lbs;
    }
  });

  let totalAmount = 0;
  let totalLbs = 0;

  map.forEach((g) => {
    const amount = g.lbs * g.price;
    totalAmount += amount;
    totalLbs += g.lbs;

    ws.addRow({
      boxes: g.boxes,
      lbs: g.lbs,
      desc: g.desc,
      size: g.size,
      form: g.form,
      sci: "",
      price: g.price,
      amount,
    });
  });

  ws.addRow([]);
  ws.addRow({
    desc: "TOTAL",
    lbs: totalLbs,
    amount: totalAmount,
  });

  return ws;
}

// ==============================
// Sheet: PACKING (GENERAL)
// ==============================

function buildPackingSheet(
  wb: ExcelJS.Workbook,
  header: any,
  lines: any[]
) {
  const ws = wb.addWorksheet("Packing");

  ws.columns = [
    { header: "Box No.", key: "box", width: 10 },
    { header: "Item Name", key: "desc", width: 30 },
    { header: "Form", key: "form", width: 10 },
    { header: "Size", key: "size", width: 12 },
    { header: "Box Weight (lbs)", key: "lbs", width: 18 },
  ];

  lines
    .sort((a, b) => a.box_no - b.box_no)
    .forEach((l) => {
      ws.addRow({
        box: l.box_no,
        desc: l.species_name,
        form: l.form,
        size: l.size,
        lbs: l.lbs,
      });
    });

  return ws;
}

// ==============================
// API
// ==============================

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id; // 🔥 usamos UUID, NO invoice_no

  // 1️⃣ Header
  const { data: packing, error: e1 } = await supabase
    .from("packings")
    .select(`
      id,
      invoice_no,
      client_code,
      clients ( name ),
      created_at
    `)
    .eq("id", id)   // 🔥 CAMBIO IMPORTANTE
    .single();

  if (e1 || !packing) {
    return NextResponse.json({ error: "Packing not found" }, { status: 404 });
  }

  // 2️⃣ Lines
  const { data: lines, error: e2 } = await supabase
    .from("packing_lines")
    .select(`
      box_no,
      species_name,
      pricing_key,
      size,
      form,
      lbs,
      price
    `)
    .eq("packing_id", packing.id)
    .order("box_no");

  if (e2) {
    return NextResponse.json({ error: e2.message }, { status: 500 });
  }

  // 3️⃣ Workbook
  const wb = new ExcelJS.Workbook();

  buildInvoiceSheet(wb, packing, lines || []);
  buildPackingSheet(wb, packing, lines || []);

  // 4️⃣ Export
  const buffer = await wb.xlsx.writeBuffer();
  const filename = `Packing_Invoice_${packing.invoice_no}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
