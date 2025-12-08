import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: Request,
  { params }: { params: { invoice: string } }
) {
  try {
    const invoice_no = params.invoice;

    // 1) Obtener packing
    const { data: packing, error: e1 } = await supabase
      .from("packings")
      .select("*")
      .eq("invoice_no", invoice_no)
      .single();

    if (e1 || !packing) {
      return NextResponse.json(
        { error: "No existe el packing" },
        { status: 404 }
      );
    }

    const client = packing.client_code;
    const isSeaLion = client === "SL";

    // 2) Obtener líneas
    const { data: lines, error: e2 } = await supabase
      .from("packing_lines")
      .select("*")
      .eq("invoice_no", invoice_no)
      .order("line_no");

    if (e2) {
      return NextResponse.json(
        { error: "No se pudieron obtener las líneas" },
        { status: 500 }
      );
    }

    // 3) Crear Excel
    const wb = new ExcelJS.Workbook();

    if (isSeaLion) {
      const ws1 = wb.addWorksheet("Purchase Order Lines");
      const ws2 = wb.addWorksheet("Factura");

      ws1.addRow(["PO Lines – Sea Lion"]);
      ws2.addRow(["Factura – Sea Lion"]);

    } else {
      const ws1 = wb.addWorksheet("Packing List");
      const ws2 = wb.addWorksheet("Factura");

      ws1.addRow(["Packing List – Cliente normal"]);
      ws2.addRow(["Factura – Cliente normal"]);
    }

    // 4) Enviar archivo
    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=Invoice_${invoice_no}.xlsx`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error desconocido" },
      { status: 500 }
    );
  }
}
