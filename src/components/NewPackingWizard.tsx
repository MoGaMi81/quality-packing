"use client";

import { useEffect, useState } from "react";
import { usePackingStore } from "@/store/packingStore";
import BoxesWizardModal from "@/components/BoxesWizardModal";
import { fetchJSON } from "@/lib/fetchJSON";
import { useRouter } from "next/navigation";
import { groupBoxes } from "@/lib/groupBoxes";
import PricingModal from "@/components/PricingModal";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function NewPackingWizard({ open, onClose }: Props) {
  const router = useRouter();

  const {
    packing_id,
    header,
    lines,
    setHeader,
    loadFromDB,
    reset,
  } = usePackingStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [invoice, setInvoice] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openPricing, setOpenPricing] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [openBoxes, setOpenBoxes] = useState(false);
  const [editingBox, setEditingBox] = useState<number | null>(null);

  /* ================= RESET ================= */
  useEffect(() => {
    if (open) {
      reset();
      setStep(1);
      setInvoice("");
      setError(null);
    }
  }, [open, reset]);

  if (!open) return null;

  /* ================= PASO 1 ================= */
  async function goStep1() {
    if (!invoice.trim()) return;

    setValidating(true);
    setError(null);

    try {
      const r = await fetchJSON<any>(
        `/api/packings/by-invoice/${encodeURIComponent(invoice.trim())}`
      );

      if (r?.packing) {
        loadFromDB({
          packing_id: r.packing.id,
          status: r.packing.status,
          header: {
            invoice_no: r.packing.invoice_no,
            client_code: r.packing.client_code,
            date: r.packing.date,
            guide: r.packing.guide,
          },
          lines: r.lines ?? [],
        });
      } else {
        setHeader({
          invoice_no: invoice.trim().toUpperCase(),
          client_code: "",
          date: new Date().toISOString().slice(0, 10),
          guide: "",
        });
      }

      setStep(2);
    } catch {
      setError("No se pudo validar la factura.");
    } finally {
      setValidating(false);
    }
  }

  <button
  onClick={() => setOpenPricing(true)}
  className="mb-3 bg-black text-white px-4 py-2 rounded w-full"
>
  Asignar precios
</button>

  /* ================= GUARDAR BORRADOR ================= */
  async function saveDraftAndExit() {
  if (!header?.invoice_no) {
    alert("Header incompleto");
    return;
  }

  try {
    const res = await fetch("/api/packings/save-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packing_id,
        header,
        lines,
        status: "DRAFT",
      }),
    });

    const data = await res.json();

    if (!res.ok || !data?.ok) {
      console.error(data);
      alert(data?.error || "Error al guardar borrador");
      return; // ⛔ NO salir
    }

    alert("Borrador guardado correctamente"); // ← IMPORTANTE
    reset();
    onClose();
    router.push("/");

  } catch (e) {
    console.error(e);
    alert("Error de red al guardar borrador");
  }
}


  /* ================= FINALIZAR ================= */
  async function finalize() {
    if (!packing_id) {
      alert("Packing inválido");
      return;
    }

    if (!header?.client_code || !header?.date) {
      alert("Header incompleto");
      return;
    }

    const res = await fetch("/api/packings/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packing_id,
        header,
        lines,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      alert(data.error);
      return;
    }

    router.push("/packings");
  }

  /* ================= DATOS DERIVADOS ================= */
  const grouped = groupBoxes(lines);
  const totalCajas = grouped.length;
  const totalLbs = grouped.reduce((s, b) => s + b.total_lbs, 0);

  /* ================= UI ================= */
  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
        <div className="bg-white p-8 rounded-xl w-full max-w-3xl">
          <h1 className="text-3xl font-bold mb-6">
            Paso {step} de 3
          </h1>

          {/* ===== PASO 1 ===== */}
          {step === 1 && (
            <>
              <label>Factura</label>
              <input
                className="border rounded px-3 py-2 w-full"
                value={invoice}
                onChange={(e) => setInvoice(e.target.value)}
              />

              {error && <div className="text-red-600 mt-2">{error}</div>}

              <button
                disabled={validating}
                onClick={goStep1}
                className="mt-4 bg-black text-white px-4 py-2 rounded w-full"
              >
                {validating ? "Validando..." : "Continuar"}
              </button>
            </>
          )}

          {/* ===== PASO 2 ===== */}
          {step === 2 && (
            <>
              <p className="mb-2">
                Factura: <b>{header?.invoice_no}</b>
              </p>

              <button
                onClick={() => {
                  setEditingBox(null);
                  setOpenBoxes(true);
                }}
                className="bg-black text-white px-4 py-2 rounded w-full"
              >
                + Agregar cajas
              </button>

              <div className="mt-4 border rounded p-2 max-h-56 overflow-auto">
                {grouped.map((box) => (
                  <div
                    key={box.box_no}
                    className="mb-1 border rounded p-1 cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      if (typeof box.box_no === "number") {
                        setEditingBox(box.box_no);
                        setOpenBoxes(true);
                      }
                    }}
                  >
                     <div className="font-semibold">
                        Caja #{box.box_no}
                       {box.isCombined && " (Combinada)"}
                    </div>

                    {box.lines.map((l, i) => (
                      <div key={i} className="text-sm ml-4 leading-tight text-gray-800">
                        🐟 {l.description_en} {l.form} {l.size} - {l.pounds} lbs
                      </div>
                    ))}

                    <div className="ml-4 text-xs text-gray-600 mt-1">
                      <b>Total caja:</b> {box.total_lbs} lbs
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={saveDraftAndExit}
                  className="flex-1 border px-4 py-2 rounded"
                >
                  Guardar y salir
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {/* ===== PASO 3 ===== */}
          {step === 3 && (
            <>
              <p className="text-xl font-bold mb-3">Resumen</p>

              {/* Totales siempre visibles arriba */}
              <div className="text-sm mb-2">
                <b>Total cajas:</b> {totalCajas} &nbsp;&nbsp;
                <b>Total lbs:</b> {totalLbs}
              </div>

              {/* Contenedor con scroll interno */}
              <div className="border rounded p-2 max-h-[400px] overflow-y-auto mb-4">
                {/* Encabezado tipo tabla */}
                <div className="grid grid-cols-[90px_1fr_60px_70px_70px_70px] font-semibold text-[13px] border-b pb-1 mb-1">
                  <div className="pr-1">Cajas</div>
                  <div className="pr-2">Descripción</div>
                  <div className="text-center">Form</div>
                  <div className="text-center">Size</div>
                  <div className="text-center">Lbs</div>
                  <div className="text-center">Total</div>
                </div>

                {/* Cajas */}
                {grouped.map((box) => (
                  <div key={box.box_no} className="mb-1">
                    {box.lines.map((l, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[90px_1fr_60px_70px_70px_70px] text-[13px] text-gray-800 items-center"
                      >
                        <div className="pr-1">
                         {i === 0 && (
                          <> {box.box_no}{box.isCombined ? " (MX)" : ""}</>
                         )}
                        </div>
                        <div className="pr-2 whitespace-nowrap">{l.description_en}</div>
                        <div className="text-center">{l.form}</div>
                        <div className="text-center">{l.size}</div>
                        <div className="text-center">{l.pounds} lbs</div>
                        <div className="text-center">
                          {i === 0 && (
                            <span className="font-semibold">{box.total_lbs} lbs</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Botones siempre visibles */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border rounded px-4 py-2"
                >
                  Regresar
                </button>

                <button
                  onClick={finalize}
                  className="bg-green-700 text-white px-4 py-2 rounded flex-1"
                >
                  Finalizar Packing
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <BoxesWizardModal
  open={openBoxes}
  boxNo={editingBox}
  onClose={() => {
    setOpenBoxes(false);
    setEditingBox(null);
  }}
/>
<PricingModal
  open={openPricing}
  lines={lines}
  onClose={() => setOpenPricing(false)}
  onSave={(p) => {
    setPrices(p);
    setOpenPricing(false);
  }}
/>
    </>
  );
}