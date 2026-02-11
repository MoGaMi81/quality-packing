import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ==============================
// API: Export Excel
// ==============================

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
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
    .eq("id", params.id)
    .single();

  if (e1 || !packing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 2️⃣ Lines + JOIN species
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

  // 3️⃣ Workbook
  const wb = new ExcelJS.Workbook();

  // ==============================
  // INVOICE SHEET
  // ==============================
  const invoiceSheet = wb.addWorksheet("Invoice");

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

  const map = new Map<string, any>();

  lines?.forEach((l: any) => {
    const key = `${l.code}|${l.size}|${l.form}`;

    if (!map.has(key)) {
      map.set(key, {
        desc: l.description_en,
        sci: l.species?.scientific_name ?? "",
        size: l.size,
        form: l.form,
        boxes: 1,
        pounds: l.pounds,
        price: l.price,
      });
    } else {
      const g = map.get(key);
      g.boxes += 1;
      g.pounds += l.pounds;
    }
  });

  let totalAmount = 0;
  let totalLbs = 0;

  map.forEach((g) => {
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

  // ==============================
  // PACKING SHEET
  // ==============================
  const packingSheet = wb.addWorksheet("Packing");

  packingSheet.columns = [
    { header: "Box No.", key: "box", width: 10 },
    { header: "Item Name", key: "desc", width: 30 },
    { header: "Form", key: "form", width: 10 },
    { header: "Size", key: "size", width: 12 },
    { header: "Box Weight (lbs)", key: "lbs", width: 18 },
  ];

  lines
    ?.sort((a: any, b: any) => a.box_no - b.box_no)
    .forEach((l: any) => {
      packingSheet.addRow({
        box: l.box_no,
        desc: l.description_en,
        form: l.form,
        size: l.size,
        lbs: l.pounds,
      });
    });

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