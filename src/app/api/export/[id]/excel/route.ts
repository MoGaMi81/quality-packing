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
  // 🟩 INVOICE SHEET (LÓGICA CORRECTA)
  // ============================================================
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

  // 1️⃣ Agrupar por caja real
  const invoiceBoxesMap = new Map<number, any>();

  lines?.forEach((l: any) => {
    if (!invoiceBoxesMap.has(l.box_no)) {
      invoiceBoxesMap.set(l.box_no, {
        box_no: l.box_no,
        is_combined: l.is_combined,
        lines: [l],
      });
    } else {
      invoiceBoxesMap.get(l.box_no).lines.push(l);
    }
  });

  const simpleMap = new Map<string, any>();
  const combinedBoxes: any[] = [];

  // 2️⃣ Separar simples y combinadas
  invoiceBoxesMap.forEach((box) => {
    if (box.is_combined) {
      combinedBoxes.push(box);
    } else {
      box.lines.forEach((l: any) => {
        const key = `${l.description_en}|${l.size}|${l.form}`;

        if (!simpleMap.has(key)) {
          simpleMap.set(key, {
            desc: l.description_en,
            sci: l.species?.scientific_name ?? "",
            size: l.size,
            form: l.form,
            boxes: 1,
            pounds: l.pounds,
            price: l.price,
          });
        } else {
          const g = simpleMap.get(key);
          g.boxes += 1;
          g.pounds += l.pounds;
        }
      });
    }
  });

  // 3️⃣ Imprimir simples agrupadas
  let totalAmount = 0;
  let totalLbs = 0;

  simpleMap.forEach((g) => {
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

  // 4️⃣ Imprimir combinadas EXACTAS
  combinedBoxes.forEach((box) => {
    box.lines.forEach((l: any, index: number) => {
      const amount = l.pounds * l.price;
      totalAmount += amount;
      totalLbs += l.pounds;

      invoiceSheet.addRow({
        boxes: index === 0 ? 1 : "", // solo la primera línea muestra 1
        lbs: l.pounds,
        desc: l.description_en,
        size: l.size,
        form: l.form,
        sci: l.species?.scientific_name ?? "",
        price: l.price,
        amount,
      });
    });
  });

  // Totales
  invoiceSheet.addRow([]);
  invoiceSheet.addRow({
    desc: "TOTAL",
    lbs: totalLbs,
    amount: totalAmount,
  });

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