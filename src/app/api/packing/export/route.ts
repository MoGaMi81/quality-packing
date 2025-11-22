import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { readJson } from "@/lib/json-db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const invoice = (searchParams.get("invoice") || "").trim().toUpperCase();
  if (!invoice) return NextResponse.json({ ok:false, error:"missing invoice" }, { status:400 });

  const packings = await readJson<any[]>("packings.json", []);
  const p = packings.find(x => (x?.header?.invoice || "").toUpperCase() === invoice);
  if (!p) return NextResponse.json({ ok:false, error:"not found" }, { status:404 });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Packing");

  ws.columns = [
    { header: "Box No.", key: "box_no", width: 10 },
    { header: "Item Name/Producto", key: "description_en", width: 35 },
    { header: "FORM", key: "form", width: 10 },
    { header: "Size/Talla", key: "size", width: 12 },
    { header: "Box Weight (lbs)", key: "pounds", width: 18 },
  ];

  ws.addRow([]);
  ws.addRow([`CLIENT: ${p.header.client_code} — ${p.header.client_name}`]);
  ws.addRow([p.header.client_address || ""]);
  ws.addRow([`TAX: ${p.header.client_tax || "-"}`]);
  ws.addRow([`INVOICE: ${p.header.invoice}   GUIDE: ${p.header.guide || "-"}`]);
  ws.addRow([`DATE: ${p.header.date || "-"}   ORIGIN: ${p.header.origin || "MEXICO"}`]);
  ws.addRow([]);
  ws.addRow([]);

  p.lines.forEach((l: any) => ws.addRow(l));

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="packing-${invoice}.xlsx"`,
    },
  });
}

