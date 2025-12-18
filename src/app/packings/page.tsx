// src/app/packings/page.tsx
"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { usePackingStore } from "@/store/packingStore";
import NewPackingWizard from "@/components/NewPackingWizard";
import BoxesWizardModal from "@/components/BoxesWizardModal";
import { fetchJSON } from "@/lib/fetchJSON";

// Convierte "2025-11-30" → "11/30/2025"
function isoToDisplay(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

// Convierte "11/30/2025" → "2025-11-30"
function displayToIso(display: string) {
  const parts = display.split("/");
  if (parts.length !== 3) return display;
  const [m, d, y] = parts;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export default function PackingPage() {
  const { header, setHeader, lines } = usePackingStore();
  
  const [openWizard, setOpenWizard] = useState(!header);
  const [openBoxes, setOpenBoxes] = useState(false);

  const [clientCode, setClientCode] = useState("");
  const [guide, setGuide] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (!header) return;
    setClientCode(header.client_code);
    setGuide(header.guide);
    setInvoiceNo(header.invoice_no);
    setDate(header.date);
  }, [header]);

  const totalBoxes = new Set(lines.map((l) => l.box_no)).size;
  const totalLbs = lines.reduce((s, l) => s + l.pounds, 0);

  return (
    <main className="w-full flex justify-center bg-gray-100 min-h-screen">
      <div className="w-full max-w-4xl p-6 space-y-6">

        <NewPackingWizard
          open={openWizard}
          onClose={() => setOpenWizard(false)}
        />

        {header && !openWizard && (
          <div className="bg-white p-6 rounded-xl shadow-md space-y-6">

            <h1 className="text-3xl font-bold text-center">
              Ingreso de Packing
            </h1>

            {/* HEADER */}
            <section className="border rounded-xl p-6 bg-gray-50 space-y-4">
              <div>
                <label className="font-semibold">Cliente</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={clientCode}
                  onChange={(e) => {
                    setClientCode(e.target.value);
                    setHeader({
                      ...header,
                      client_code: e.target.value,
                    });
                  }}
                />
              </div>

              <div>
                <label className="font-semibold">AWB</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={guide}
                  onChange={(e) => {
                    setGuide(e.target.value);
                    setHeader({ ...header, guide: e.target.value });
                  }}
                />
              </div>

              <div>
                <label className="font-semibold">Factura</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={invoiceNo}
                  disabled
                />
              </div>

              <div>
                <label className="font-semibold">Fecha</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={isoToDisplay(date)}
                  onChange={(e) =>
                    setHeader({
                      ...header,
                      date: displayToIso(e.target.value),
                    })
                  }
                />
              </div>
            </section>

            {/* ACTIONS */}
            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded bg-black text-white"
                onClick={() => setOpenBoxes(true)}
              >
                + Agregar cajas
              </button>

              <button
  className="ml-auto px-4 py-2 rounded bg-green-700 text-white"
  onClick={async () => {
    if (!header) return;

    const ok = confirm("¿Finalizar packing? No podrás editarlo después.");
    if (!ok) return;

    try {
      await fetchJSON("/api/packing/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packing_id: usePackingStore.getState().packing_id,
          header,
          lines,
        }),
      });

      alert("Packing finalizado.");
      window.location.href = `/packings/${header.invoice_no}/view`;
    } catch (e: any) {
      alert(e.message || "Error al finalizar.");
    }
  }}
>
  Finalizar packing
</button>

            </div>

            {/* TABLE */}
            <table className="min-w-full border rounded bg-white">
              <thead>
                <tr>
                  <th className="border p-2">Box</th>
                  <th className="border p-2">Item</th>
                  <th className="border p-2">Form</th>
                  <th className="border p-2">Size</th>
                  <th className="border p-2 text-right">Lbs</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td className="border p-2">{l.box_no}</td>
                    <td className="border p-2">{l.description_en}</td>
                    <td className="border p-2">{l.form}</td>
                    <td className="border p-2">{l.size}</td>
                    <td className="border p-2 text-right">{l.pounds}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="border p-2 font-semibold">TOTAL</td>
                  <td colSpan={3} className="border p-2"></td>
                  <td className="border p-2 text-right font-semibold">
                    {totalLbs}
                  </td>
                </tr>
                <tr>
                  <td className="border p-2 font-semibold">BOXES</td>
                  <td colSpan={3} className="border p-2"></td>
                  <td className="border p-2 text-right font-semibold">
                    {totalBoxes}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <BoxesWizardModal
          open={openBoxes}
          onClose={() => setOpenBoxes(false)}
        />
      </div>
    </main>
  );
}