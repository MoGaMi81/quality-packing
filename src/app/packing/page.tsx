"use client";

import { useState } from "react";
import { usePackingStore } from "@/store/packingStore";
import AddBoxModal from "@/components/AddBoxModal";
import AddRangeModal from "@/components/AddRangeModal";
import AddCombinedModal from "@/components/AddCombinedModal";
import NewPackingWizard from "@/components/NewPackingWizard";
import type { PackingHeader } from "@/domain/packing/types";
import { fetchJSON } from "@/lib/fetchJSON";

// Tipo de línea simple
type SimpleItem = {
  description_en: string;
  size: string;
  form: string;
  pounds: number;
};

// utilidad para obtener siguiente número de caja
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

  // Abrir Wizard solo si no existe header
  const [openWizard, setOpenWizard] = useState(!header);

  // Modales de cajas
  const [openAdd, setOpenAdd] = useState(false);
  const [openRange, setOpenRange] = useState(false);
  const [openComb, setOpenComb] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  // Encabezado
  const [clientCode, setClientCode] = useState(header?.client_code ?? "");
  const [guide, setGuide] = useState(header?.guide ?? "");
  const [invoiceNo, setInvoiceNo] = useState(header?.invoice_no ?? "");
  const [date, setDate] = useState(
    header?.date ?? new Date().toISOString().slice(0, 10)
  );

  const [selBox, setSelBox] = useState<number | null>(null);

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

  // simple
  const addSimple = (item: SimpleItem) => {
    const newBox = getNextBox(lines);
    addLine(item, newBox);
  };

  const deleteSelected = () => {
    if (selBox == null) return;
    deleteBox(selBox);
    setSelBox(null);
  };

  const sortedLines = [...lines].sort(
    (a, b) => a.box_no - b.box_no || a.description_en.localeCompare(b.description_en)
  );

  const totalBoxes = new Set(lines.map((l) => l.box_no)).size;
  const totalLbs = lines.reduce((s, l) => s + l.pounds, 0);

  // ***********************
  //      RENDER
  // ***********************
  return (
    <main className="w-full flex justify-center">
      <div className="w-full max-w-4xl p-6 space-y-6">

        {/* WIZARD */}
        <NewPackingWizard
          open={openWizard}
          onClose={() => setOpenWizard(false)}
        />

        {/* Si NO hay header → no mostrar nada más */}
        {!header && !openWizard && (
          <div className="text-center mt-10 text-gray-500">
            Iniciando packing...
          </div>
        )}

        {header && !openWizard && (
          <>
            {/* ENCABEZADO PRINCIPAL */}
            <h1 className="text-3xl font-bold text-center">
              Ingreso de Packing
            </h1>

            <section className="border rounded-xl p-4 space-y-4 bg-white shadow-sm">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cliente */}
                <div className="space-y-2">
                  <label className="text-sm">Cliente:</label>
                  <div className="flex gap-2">
                    <input
                      className="border rounded px-2 py-1 w-full"
                      value={clientCode}
                      onChange={(e) => setClientCode(e.target.value)}
                      placeholder="HE, SL, ..."
                    />
                    <button
                      className="px-3 py-1 rounded bg-black text-white"
                      onClick={resolveClient}
                    >
                      Ok
                    </button>
                  </div>

                  <div className="text-sm mt-1">
                    <b>{header.client_name}</b>
                    <div>{header.address}</div>
                    <div>TAX: {header.tax_id}</div>
                  </div>
                </div>

                {/* Factura / AWB / Fecha */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm">AWB:</label>
                    <input
                      className="border rounded px-2 py-1 w-full"
                      value={guide}
                      onChange={(e) => setGuide(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm">Factura #:</label>
                    <input
                      className="border rounded px-2 py-1 w-full"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm">Fecha:</label>
                    <input
                      type="date"
                      className="border rounded px-2 py-1 w-full"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* BOTONES DE CAJAS */}
            <section className="flex gap-2">
              <button
                className="px-3 py-1 rounded bg-black text-white"
                onClick={() => setOpenAdd(true)}
              >
                + Simple
              </button>

              <button
                className="px-3 py-1 rounded border"
                onClick={() => setOpenRange(true)}
              >
                + Rango
              </button>

              <button
                className="px-3 py-1 rounded border"
                onClick={() => setOpenComb(true)}
              >
                + Combinada
              </button>

              {/* Guardar */}
              <button
                className="px-3 py-1 rounded bg-green-600 text-white ml-auto"
                onClick={async () => {
                  const ok = confirm("¿Guardar packing?");
                  if (!ok) return;

                  try {
                    await fetchJSON("/api/packing/save", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        status: "final",
                        packing: { invoice_no: invoiceNo, header, lines },
                      }),
                    });

                    alert("Packing guardado.");
                    clear();
                    window.location.href = "/packing";
                  } catch (err: any) {
                    alert(err.message || "Error al guardar.");
                  }
                }}
              >
                Guardar
              </button>
            </section>

            {/* TABLA */}
            <section className="overflow-x-auto">
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
                    <td className="p-2 border font-semibold">TOTAL BOXES</td>
                    <td className="p-2 border" colSpan={3}></td>
                    <td className="p-2 border text-right font-semibold">
                      {totalBoxes}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-semibold">TOTAL LBS</td>
                    <td className="p-2 border" colSpan={3}></td>
                    <td className="p-2 border text-right font-semibold">
                      {totalLbs}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </section>

            {/* MODALES */}
            <AddBoxModal
              open={openAdd}
              onClose={() => setOpenAdd(false)}
              onAdded={addSimple}
            />

            <AddRangeModal
              open={openRange}
              onClose={() => setOpenRange(false)}
              onAdded={(items: SimpleItem[]) => {
                const start = getNextBox(lines);
                items.forEach((it, idx) => addLine(it, start + idx));
              }}
            />

            <AddCombinedModal
              open={openComb}
              onClose={() => setOpenComb(false)}
              onAdded={(items: SimpleItem[]) => {
                if (!items.length) return;
                const box = getNextBox(lines);
                items.forEach((it) => addLine(it, box));
              }}
            />

            <AddCombinedModal
              open={openEdit}
              onClose={() => setOpenEdit(false)}
              onAdded={(items: SimpleItem[]) => {
                if (!selBox) return;
                deleteBox(selBox);
                items.forEach((it) => addLine(it, selBox));
              }}
            />
          </>
        )}
      </div>
    </main>
  );
}
