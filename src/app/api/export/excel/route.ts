// src/app/api/export/excel/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const invoice = url.searchParams.get("invoice") ?? "";

  if (!invoice) {
    return NextResponse.json({ ok: false, error: "Missing invoice" }, { status: 400 });
  }

  // TODO: aquí arma el .xlsx real con exceljs usando invoice
  const bytes = new Uint8Array(); // archivo vacío para no dar 404

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="packing-${invoice}.xlsx"`,
    },
  });
}
