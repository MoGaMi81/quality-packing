// src/lib/exportExcel.ts
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { PackingLine } from "@/domain/packing/types";
import type { InvoiceLine } from "@/domain/packing/types";

export function exportPackingAndInvoiceExcel(
  filename: string,
  header: { client_name: string; address?: string; tax_id?: string; guide?: string; invoice_no?: string; date?: string; },
  packing: PackingLine[],
  invoice: InvoiceLine[],
  boxes110: number, boxes55: number, amountWordsEn: string, grandTotal?: number
) {
  // Packing sheet (simple)
  const packingRows = packing.map(l => ({
    "Box No.": l.box_no,
    "Item Name/Producto": l.description_en,
    "FORM": l.form,
    "Size/Talla": l.size,
    "Box Weight/Peso Caja": l.pounds
  }));

  // Invoice sheet
  const invoiceRows = invoice.map(r => ({
    "Boxes": r.boxes,
    "Pounds": r.pounds,
    "Description": r.description_en,
    "SIZE": r.size,
    "FORM": r.form,
    "SCIENTIFIC NAME": r.scientific_name,
    "Price": r.price ?? "",
    "Amount": r.amount ?? ""
  }));

  const wb = XLSX.utils.book_new();

  // Encabezado como primeras filas (Invoice)
  const invHeader: any[][] = [
    ["CLIENT", header.client_name],
    ["ADDRESS", header.address || ""],
    ["TAX ID", header.tax_id || ""],
    ["GUIDE", header.guide || ""],
    ["INVOICE", header.invoice_no || "", "DATE", header.date || ""],
    ["COUNTRY OF ORIGIN:", "MEXICO"],
    [],
  ];
  const wsInv = XLSX.utils.aoa_to_sheet(invHeader);
  XLSX.utils.sheet_add_json(wsInv, invoiceRows, { origin: -1 });
  // Totales al final
  const lastRow = invHeader.length + invoiceRows.length + 1;
  XLSX.utils.sheet_add_aoa(wsInv, [["", "", "", "", "", "", "", grandTotal ?? ""]], { origin: `A${lastRow}` });
  XLSX.utils.sheet_add_aoa(wsInv, [[`${amountWordsEn}`]], { origin: `A${lastRow+2}` });
  XLSX.utils.sheet_add_aoa(wsInv, [[`${boxes110}  BOXES 110 LBS`]], { origin: `A${lastRow+4}` });
  XLSX.utils.sheet_add_aoa(wsInv, [[`${boxes55}  BOXES  55 LBS`]], { origin: `A${lastRow+5}` });

  XLSX.utils.book_append_sheet(wb, wsInv, "Invoice");

  // Packing sheet con total lbs al final
  const wsPack = XLSX.utils.json_to_sheet(packingRows);
  const totalLbs = packing.reduce((s, l) => s + l.pounds, 0);
  const endPack = packingRows.length + 2;
  XLSX.utils.sheet_add_aoa(wsPack, [[ "", "", "", "TOTAL BOXES", totalLbs ]], { origin: `A${endPack}` });
  XLSX.utils.book_append_sheet(wb, wsPack, "Packing");

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  saveAs(new Blob([buf], { type: "application/octet-stream" }), `${filename}.xlsx`);
}
