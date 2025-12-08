import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

// ----- Helpers -----
function numberToWordsUSD(value: number): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const parts = formatter.formatToParts(value);
  const [intStr, decStr] = [parts.find(p => p.type === "integer")?.value || "0",
                            parts.find(p => p.type === "fraction")?.value || "00"];

  const words = require("number-to-words").toWords(Number(intStr)).toUpperCase();
  return `${words} USD ${decStr}/100`;
}

function isSeaLion(clientCode: string) {
  return clientCode.trim().toUpperCase() === "SL";
}

// ------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _req: Request,
  { params }: { params: { invoice: string } }
) {
  try {
    const invoice = params.invoice.toUpperCase();

    // 1) Obtener packing head
    const { data: packing, error: e1 } = await supabase
      .from("packings")
      .select("*")
      .eq("invoice_no", invoice)
      .single();

    if (e1 || !packing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // 2) Obtener líneas
    const { data: lines, error: e2 } = await supabase
      .from("packing_lines")
      .select("*")
      .eq("packing_id", packing.id)
      .order("box_no");

    if (e2) {
      return NextResponse.json({ error: e2.message }, { status: 500 });
    }

    const workbook = new ExcelJS.Workbook();

    // =====================================================
    //  HOJA 1 — Packing List OR Purchase Order Lines
    // =====================================================

    const sheet1 = workbook.addWorksheet(
      isSeaLion(packing.client_code)
        ? "Purchase Order Lines"
        : "Packing List"
    );

    sheet1.columns = [
      { header: "Box No.", key: "box", width: 10 },
      { header: "Description", key: "desc", width: 30 },
      { header: "Form", key: "form", width: 10 },
      { header: "Size", key: "size", width: 10 },
      { header: "Lbs Per Box", key: "lbsbox", width: 12 },
      { header: "Total Weight", key: "total", width: 14 },
    ];

    const isSL = isSeaLion(packing.client_code);

    // ===== Lógica para agrupar rangos SOLO si NO es Sea Lion =====
    let grouped: any[] = [];

    if (!isSL) {
      const map = new Map<string, any>();

      lines.forEach(l => {
        const key = `${l.description_en}|${l.size}|${l.form}|${l.pounds}`;

        if (!map.has(key)) {
          map.set(key, {
            description_en: l.description_en,
            size: l.size,
            form: l.form,
            pounds: l.pounds,
            boxes: 1,
          });
        } else {
          map.get(key).boxes++;
        }
      });

      grouped = Array.from(map.values());
    }

    // ===== AGREGAR FILAS =====
    if (isSL) {
      // Sea Lion => todo individual
      lines.forEach(l => {
        sheet1.addRow({
          box: l.box_no,
          desc: l.description_en,
          form: l.form,
          size: l.size,
          lbsbox: l.pounds,
          total: l.pounds,
        });
      });
    } else {
      // Clientes normales => agrupar rangos
      grouped.forEach(g => {
        const total = g.boxes * g.pounds;

        sheet1.addRow({
          box: g.boxes > 1 ? `1-${g.boxes}` : "1",
          desc: g.description_en,
          form: g.form,
          size: g.size,
          lbsbox: g.pounds,
          total,
        });
      });
    }

    // =====================================================
    //  HOJA 2 — Invoice
    // =====================================================

    const sheet2 = workbook.addWorksheet("Invoice");

    sheet2.columns = [
      { header: "Boxes", key: "boxes", width: 10 },
      { header: "Pounds", key: "lbs", width: 12 },
      { header: "Description", key: "desc", width: 25 },
      { header: "Size", key: "size", width: 12 },
      { header: "Form", key: "form", width: 10 },
      { header: "Scientific Name", key: "sci", width: 20 },
      { header: "Price", key: "price", width: 10 },
      { header: "Amount", key: "amount", width: 12 },
    ];

    // Fase 2: cuando activemos PRICING haremos price/amount reales
    lines.forEach(l => {
      sheet2.addRow({
        boxes: 1,
        lbs: l.pounds,
        desc: l.description_en,
        size: l.size,
        form: l.form,
        sci: "", // después vendrá del catálogo
        price: 0,
        amount: 0,
      });
    });

    // =====================================================
    // EXPORTAR
    // =====================================================

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Invoice_${invoice}_${packing.client_code}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

  } catch (err: any) {
    console.error("EXPORT ERROR:", err);
    return NextResponse.json({ error: "Internal export error" }, { status: 500 });
  }
}
