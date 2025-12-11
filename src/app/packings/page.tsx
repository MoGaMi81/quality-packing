// src/app/packings/page.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { usePackingStore } from "@/store/packingStore";
import AddBoxModal from "@/components/AddBoxModal";
import AddRangeModal from "@/components/AddRangeModal";
import AddCombinedModal from "@/components/AddCombinedModal";
import NewPackingWizard from "@/components/NewPackingWizard";
import type { PackingHeader } from "@/domain/packing/types";
import { fetchJSON } from "@/lib/fetchJSON";

// Convierte "2025-11-30" → "11/30/2025"
function isoToDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

// Convierte "11/30/2025" → "2025-11-30"
function displayToIso(display: string) {
  if (!display) return "";
  const parts = display.split("/");
  if (parts.length !== 3) return display; // por si el usuario escribe basura

  const [m, d, y] = parts;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

type SimpleItem = {
  description_en: string;
  size: string;
  form: string;
  pounds: number;
};

function getNextBox(lines: { box_no: number }[]): number {
  if (!lines.length) return 1;
  const max = lines.reduce(
    (m, l) => (l.box_no > m ? l.box_no : m),
    lines[0].box_no
  );
  return max + 1;
}

export default function PackingPage() {
  const { header, setHeader, lines, addLine, deleteBox, clear } =
    usePackingStore();

  const [openWizard, setOpenWizard] = useState(!header);
  const [openAdd, setOpenAdd] = useState(false);
  const [openRange, setOpenRange] = useState(false);
  const [openComb, setOpenComb] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selBox] = useState<number | null>(null);

  // Estados controlados sincronizados con el header real
const [clientCode, setClientCode] = useState("");
const [guide, setGuide] = useState("");
const [invoiceNo, setInvoiceNo] = useState("");
const [date, setDate] = useState("");

// Cuando el header cambia (desde el wizard), actualizar los campos
useEffect(() => {
  if (!header) return;

  setClientCode(header.client_code ?? "");
  setGuide(header.guide ?? "");
  setInvoiceNo(header.invoice_no ?? "");
  setDate(header.date ?? new Date().toISOString().slice(0, 10));
}, [header]);


  const resolveClient = async () => {
    const c = clientCode.trim().toUpperCase();
    if (!c) return;
    try {
      const r = await fetchJSON<any>(
        `/api/catalogs/client/${encodeURIComponent(c)}`
      );

      const h: PackingHeader = {
        client_code: c,
        client_name: r.name,
        address: r.address,
        tax_id: r.tax_id,
        guide,
        invoice_no: invoiceNo,
        date,
      };

      setHeader(h);
    } catch {
      alert("Cliente no encontrado.");
    }
  };

  const addSimple = (item: SimpleItem) => {
    const newBox = getNextBox(lines);
    addLine(item, newBox);
  };

  const sortedLines = [...lines].sort(
    (a, b) =>
      a.box_no - b.box_no ||
      a.description_en.localeCompare(b.description_en)
  );

  const totalBoxes = new Set(lines.map((l) => l.box_no)).size;
  const totalLbs = lines.reduce((s, l) => s + l.pounds, 0);

  return (
    <main className="w-full flex justify-center bg-gray-100 min-h-screen">
      
      <div className="w-full max-w-4xl p-6 space-y-6">
        <NewPackingWizard
          open={openWizard}
          onClose={() => setOpenWizard(false)}
        />

        {!header && !openWizard && (
          <div className="text-center mt-10 text-gray-500">
            Iniciando packing...
          </div>
        )}

        {header && !openWizard && (
          <div className="bg-white p-6 rounded-xl shadow-md space-y-10">

            {/* TÍTULO */}
            <h1 className="text-3xl font-bold text-center">Ingreso de Packing</h1>

            {/* Sección del encabezado */}
            <section className="border rounded-xl p-6 bg-gray-50 shadow-inner space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Cliente */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold">Cliente:</label>
                  <div className="flex gap-2">
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={clientCode}
                      onChange={(e) => setClientCode(e.target.value)}
                      placeholder="codigo.."
                    />
                    <button
                      className="px-3 py-2 rounded bg-black text-white"
                      onClick={resolveClient}
                    >
                      Ok
                    </button>
                  </div>

                  <div className="text-sm leading-snug">
                    <b className="text-base">{header.client_name}</b>
                    <div>{header.address}</div>
                    <div className="font-semibold">TAX: {header.tax_id}</div>
                  </div>
                </div>

                {/* AWB / Factura / Fecha */}
                <div className="grid grid-cols-2 gap-4">

                  <div className="col-span-2">
                    <label className="text-sm font-semibold">AWB:</label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={guide}
                      onChange={(e) => setGuide(e.target.value)}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-sm font-semibold">Factura #:</label>
                    <input
                      className="border rounded px-3 py-2 w-full"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-sm font-semibold">Fecha:</label>
                    <input
                    type="text"
                    className="border rounded px-3 py-2 w-full"
                  placeholder="mm/dd/yyyy"
                 value={isoToDisplay(date)}
                 onChange={(e) => {
               const display = e.target.value;
             setDate(displayToIso(display));
              }}
              />
               </div>

                </div>
              </div>
            </section>

            {/* BOTONES */}
            <section className="flex gap-3 pt-2">

              <button
                className="px-4 py-2 rounded bg-black text-white"
                onClick={() => setOpenAdd(true)}
              >
                + Simple
              </button>

              <button
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => setOpenRange(true)}
              >
                + Rango
              </button>

              <button
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => setOpenComb(true)}
              >
                + Combinada
              </button>

              <button
                className="px-4 py-2 rounded bg-green-600 text-white ml-auto"
                onClick={async () => {
                  const ok = confirm("¿Guardar packing?");
                  if (!ok) return;

                  try {
                    await fetchJSON("/api/packings/save", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        status: "final",
                        packing: { invoice_no: invoiceNo, header, lines },
                      }),
                    });

                    alert("Packing guardado.");
                    clear();
                    window.location.href = "/packings";
                  } catch (err: any) {
                    alert(err.message || "Error al guardar.");
                  }
                }}
              >
                Guardar
              </button>

            </section>

            {/* TABLA */}
            <section className="overflow-x-auto bg-white p-4 rounded-xl shadow-sm">
              <table className="min-w-full border rounded bg-white shadow-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Box</th>
                    <th className="p-2 border">Item</th>
                    <th className="p-2 border">FORM</th>
                    <th className="p-2 border">Size</th>
                    <th className="p-2 border text-right">Lbs</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedLines.map((l, i) => {
                    const prev = sortedLines[i - 1];
                    const cont = prev && prev.box_no === l.box_no;

                    return (
                      <tr key={i}>
                        <td className="p-2 border">
                          {cont ? "MX" : l.box_no}
                        </td>
                        <td className="p-2 border">{l.description_en}</td>
                        <td className="p-2 border">{l.form}</td>
                        <td className="p-2 border">{l.size}</td>
                        <td className="p-2 border text-right">{l.pounds}</td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr>
                    <td className="p-2 border font-semibold">TOTAL LBS</td>
                    <td className="p-2 border" colSpan={3}></td>
                    <td className="p-2 border text-right font-semibold">
                      {totalLbs}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-semibold">TOTAL BOXES</td>
                    <td className="p-2 border" colSpan={3}></td>
                    <td className="p-2 border text-right font-semibold">
                      {totalBoxes}
                    </td>
                  </tr>
                </tfoot>

              </table>
            </section>

            {/* MODALES */}
            <AddBoxModal open={openAdd} onClose={() => setOpenAdd(false)} onAdded={addSimple} />
            <AddRangeModal open={openRange} onClose={() => setOpenRange(false)} onAdded={(items: SimpleItem[]) => {
              const start = getNextBox(lines);
              items.forEach((it, idx) => addLine(it, start + idx));
            }} />
            <AddCombinedModal open={openComb} onClose={() => setOpenComb(false)} onAdded={(items: SimpleItem[]) => {
              if (!items.length) return;
              const box = getNextBox(lines);
              items.forEach((it) => addLine(it, box));
            }} />
            <AddCombinedModal open={openEdit} onClose={() => setOpenEdit(false)} onAdded={(items: SimpleItem[]) => {
              if (!selBox) return;
              deleteBox(selBox);
              items.forEach((it) => addLine(it, selBox));
            }} />

          </div>
        )}
      </div>
    </main>
  );
}


