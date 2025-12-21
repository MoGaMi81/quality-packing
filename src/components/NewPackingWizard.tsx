"use client";

import { useEffect, useState } from "react";
import { PackingLine, usePackingStore } from "@/store/packingStore";
import BoxesWizardModal from "@/components/BoxesWizardModal";
import { fetchJSON } from "@/lib/fetchJSON";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function NewPackingWizard({ open, onClose }: Props) {
  const {
    packing_id,
    header,
    lines,
    loadFromDB,
    setHeader,
    reset,
  } = usePackingStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [invoice, setInvoice] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openBoxes, setOpenBoxes] = useState(false);

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

  /* ================= AUTO SAVE DRAFT ================= */
  useEffect(() => {
    if (step === 2 && header && !packing_id) {
      fetchJSON("/api/packings/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packing_id: null,
          header,
          lines: [],
        }),
      }).then((r) => {
        if (r?.packing_id) {
          usePackingStore.setState({ packing_id: r.packing_id });
        }
      });
    }
  }, [step, header, packing_id]);

  /* ================= AGRUPAR POR CAJA ================= */
  const boxes = lines.reduce<Record<number, PackingLine[]>>((acc, line) => {
    if (!acc[line.box_no]) acc[line.box_no] = [];
    acc[line.box_no].push(line);
    return acc;
  }, {});

  /* ================= FINALIZAR ================= */
  async function finalizePacking() {
    try {
      const r = await fetch("/api/packings/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packing_id,
          header: {
            ...header,
            status: "finalized",
          },
          lines,
        }),
      });

      const data = await r.json();
      if (!data.ok) throw new Error(data.error);

      alert("Packing finalizado correctamente");
      onClose();
    } catch (e: any) {
      alert(e.message || "Error al finalizar");
    }
  }

  /* ================= UI ================= */
  return (
    <>
      {/* ===== OVERLAY ===== */}
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

              {error && (
                <div className="text-red-600 mt-2">{error}</div>
              )}

              <button
                disabled={validating}
                onClick={goStep1}
                className="mt-4 bg-black text-white px-4 py-2 rounded w-full"
              >
                {validating ? "Validando..." : "Continuar"}
              </button>

              <button
                onClick={onClose}
                className="mt-4 text-red-600 underline w-full"
              >
                Cancelar
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
                onClick={() => setOpenBoxes(true)}
                className="bg-black text-white px-4 py-2 rounded w-full"
              >
                Agregar cajas
              </button>

              <div className="mt-4 text-sm max-h-48 overflow-auto border p-2 rounded">
                {lines.length === 0 && (
                  <div className="text-gray-400">No hay cajas aún</div>
                )}

                {Object.entries(boxes).map(([boxNo, items]) => (
                  <div key={boxNo} className="mb-2">
                    <div className="font-semibold">Caja #{boxNo}</div>
                    {items.map((l, i) => (
                      <div key={i} className="ml-4">
                        {l.code} — {l.pounds} lbs
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  if (lines.length === 0) {
                    alert("Debes agregar al menos una caja.");
                    return;
                  }
                  setStep(3);
                }}
                className="mt-4 bg-blue-700 text-white px-4 py-2 rounded w-full"
              >
                Continuar
              </button>
            </>
          )}

          {/* ===== PASO 3 ===== */}
          {step === 3 && (
            <>
              <h2 className="text-xl font-bold mb-4">Resumen</h2>

              <div className="border rounded p-4 max-h-64 overflow-auto text-sm">
                {Object.values(
                  lines.reduce((acc: any, l) => {
                    if (!acc[l.code]) {
                      acc[l.code] = {
                        code: l.code,
                        description_en: l.description_en,
                        form: l.form,
                        size: l.size,
                        scientific_name: l.scientific_name,
                        boxes: 0,
                        lbs: 0,
                      };
                    }
                    acc[l.code].boxes += 1;
                    acc[l.code].lbs += l.pounds;
                    return acc;
                  }, {})
                ).map((s: any) => (
                  <div key={s.code} className="mb-3">
                    <div className="font-semibold">
                      {s.code} — {s.description_en}
                    </div>
                    <div>{s.form} {s.size}</div>
                    <div className="italic">{s.scientific_name}</div>
                    <div>
                      Cajas: <b>{s.boxes}</b> · Total lbs: <b>{s.lbs}</b>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-sm">
                <div>Total cajas: <b>{lines.length}</b></div>
                <div>
                  Total lbs:{" "}
                  <b>{lines.reduce((s, l) => s + l.pounds, 0)}</b>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border rounded w-full"
                >
                  Regresar
                </button>

                <button
                  onClick={finalizePacking}
                  className="px-4 py-2 bg-green-700 text-white rounded w-full"
                >
                  Finalizar Packing
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ===== MODAL CAJAS ===== */}
      <BoxesWizardModal
        open={openBoxes}
        onClose={() => setOpenBoxes(false)}
      />
    </>
  );
}
