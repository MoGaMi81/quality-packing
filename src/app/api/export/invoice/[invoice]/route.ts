import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

// ============ HELPERS ============
function isSeaLion(clientCode: string) {
  return clientCode.trim().toUpperCase() === "SL";
}

// Scientific Names – vendrán del catálogo
import { catalogs } from "@/lib/loadCatalogs";
function scientificNameOf(description: string) {
  const sp = catalogs.species.find(s => s.name_en === description);
  return sp?.scientific_name || "";
}

// ==================================
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

    // 1. LOAD PACKING HEADER
    const { data: packing, error: e1 } = await supabase
      .from("packings")
      .select("*")
      .eq("invoice_no", invoice)
      .single();

    if (!packing) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // 2. LOAD LINES
    const { data: lines, error: eLines } = await supabase
      .from("packing_lines")
      .select("*")
      .eq("packing_id", packing.id)
      .order("box_no");

    if (!lines) {
      return NextResponse.json(
        { error: "No lines found" },
        { status: 404 }
      );
    }

    const workbook = new ExcelJS.Workbook();

    // =====================================================
    // SHEET 1 — PACKING LIST
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
      { header: "Size", key: "size", width: 12 },
      { header: "Lbs Per Box", key: "lbs", width: 12 },
      { header: "Total Weight", key: "total", width: 14 },
    ];

    const isSL = isSeaLion(packing.client_code);

    // ------------------ AGRUPACIÓN SOLO PARA CAJAS SIMPLES ------------------
    const finalPackingRows: any[] = [];
    let currentBoxNumber = 1;

    if (isSL) {
      // Sea Lion => NO agrupa nada
      lines.forEach((l) => {
        finalPackingRows.push({
          box: currentBoxNumber++,
          desc: l.description_en,
          form: l.form,
          size: l.size,
          lbs: l.pounds,
          total: l.pounds,
        });
      });
    } else {
      // Clientes normales => agrupa cajas simples, NO combinadas
      const groups = new Map<string, any>();

      lines.forEach((l) => {
        const isMX = l.box_no === "MX";

        if (isMX) {
          // Parte de COMBINADA – no agrupar
          finalPackingRows.push({
            box: "MX",
            desc: l.description_en,
            form: l.form,
            size: l.size,
            lbs: l.pounds,
            total: l.pounds,
          });
        } else {
          // Simple: clave para agrupar
          const key = `${l.description_en}|${l.size}|${l.form}|${l.pounds}`;

          if (!groups.has(key)) {
            groups.set(key, { ...l, count: 1 });
          } else {
            groups.get(key).count++;
          }
        }
      });

      // Ahora agregar filas simples agrupadas
      for (const g of groups.values()) {
        const { description_en, form, size, pounds, count } = g;
        const boxLabel = count > 1 ? `1-${count}` : "1";

        finalPackingRows.push({
          box: boxLabel,
          desc: description_en,
          form,
          size,
          lbs: pounds,
          total: pounds * count,
        });
      }
    }

    // AGREGAR FILAS A LA HOJA
    finalPackingRows.forEach((row) => sheet1.addRow(row));

    // =====================================================
    // SHEET 2 — INVOICE
    // =====================================================
    const sheet2 = workbook.addWorksheet("Invoice");

    sheet2.columns = [
      { header: "Boxes", key: "b", width: 10 },
      { header: "Pounds", key: "lbs", width: 12 },
      { header: "Description", key: "d", width: 30 },
      { header: "Size", key: "s", width: 12 },
      { header: "Form", key: "f", width: 10 },
      { header: "Scientific Name", key: "sci", width: 20 },
      { header: "Price", key: "p", width: 10 },
      { header: "Amount", key: "a", width: 12 },
    ];

    // ------------------ MISMA LÓGICA QUE PACKING ------------------
    finalPackingRows.forEach((r) => {
      const sci = scientificNameOf(r.desc);

      sheet2.addRow({
        b: r.box,
        lbs: r.total,
        d: r.desc,
        s: r.size,
        f: r.form,
        sci,
        p: 0,
        a: 0,
      });
    });

    // =====================================================
    // EXPORT
    // =====================================================
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `Invoice_${invoice}_${packing.client_code}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (err: any) {
    console.error("EXPORT ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
