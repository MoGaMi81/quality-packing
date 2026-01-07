import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";

// -------------------- Helpers --------------------
function isSeaLion(code: string) {
  return code.trim().toUpperCase() === "SL";
}

// -------------------------------------------------

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

    // 1) Get packing header
    const { data: packing, error: e1 } = await supabase
      .from("packings")
      .select("*")
      .eq("invoice_no", invoice)
      .single();

    if (e1 || !packing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // 2) Get lines
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
    //  SHEET 1 — PACKING LIST (or PO Lines for Sea Lion)
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

    const SL = isSeaLion(packing.client_code);

    if (SL) {
      // Sea Lion => everything individual
      lines.forEach((l) => {
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
      // NORMAL CLIENTS => GROUP IDENTICAL BOXES
      const groups = new Map<string, any>();

      lines.forEach((l) => {
        const key = `${l.description_en}|${l.size}|${l.form}|${l.pounds}`;

        if (!groups.has(key)) {
          groups.set(key, {
            desc: l.description_en,
            size: l.size,
            form: l.form,
            pounds: l.pounds,
            boxes: 1,
          });
        } else {
          groups.get(key).boxes++;
        }
      });

      groups.forEach((g) => {
        sheet1.addRow({
          box: g.boxes === 1 ? "1" : `1-${g.boxes}`,
          desc: g.desc,
          form: g.form,
          size: g.size,
          lbsbox: g.pounds,
          total: g.pounds * g.boxes,
        });
      });
    }

    // =====================================================
    //  SHEET 2 — INVOICE (always grouped)
    // =====================================================

    const sheet2 = workbook.addWorksheet("Invoice");

    sheet2.columns = [
      { header: "Boxes", key: "boxes", width: 10 },
      { header: "Pounds", key: "lbs", width: 12 },
      { header: "Description", key: "desc", width: 26 },
      { header: "Size", key: "size", width: 12 },
      { header: "Form", key: "form", width: 10 },
      { header: "Scientific Name", key: "sci", width: 20 },
      { header: "Price", key: "price", width: 10 },
      { header: "Amount", key: "amount", width: 12 },
    ];

    // GROUP FOR INVOICE
    const invMap = new Map<string, any>();

    lines.forEach((l) => {
      const key = `${l.description_en}|${l.size}|${l.form}`;

      if (!invMap.has(key)) {
        invMap.set(key, {
          desc: l.description_en,
          size: l.size,
          form: l.form,
          boxes: 1,
          pounds: l.pounds,
        });
      } else {
        let g = invMap.get(key);
        g.boxes += 1;
        g.pounds += l.pounds;
      }
    });

    invMap.forEach((g) => {
      sheet2.addRow({
        boxes: g.boxes,
        lbs: g.pounds,
        desc: g.desc,
        size: g.size,
        form: g.form,
        sci: "", // coming from catalog (phase 2)
        price: 0,
        amount: 0,
      });
    });

    // =====================================================
    //  EXPORT
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
    console.error("EXPORT ERROR", err);
    return NextResponse.json(
      { error: "Internal export error" },
      { status: 500 }
    );
  }
}
