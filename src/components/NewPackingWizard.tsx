"use client";

import { useEffect, useState } from "react";
import { usePackingStore } from "@/store/packingStore";
import BoxesWizardModal from "@/components/BoxesWizardModal";
import { fetchJSON } from "@/lib/fetchJSON";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function NewPackingWizard({ open, onClose }: Props) {
  const {
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
  }, [open]);

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

      // 🔹 CASO 1: existe → continuar draft
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
        // 🔹 CASO 2: NO existe → nuevo draft
        setHeader({
          invoice_no: invoice.trim().toUpperCase(),
          client_code: "",
          date: new Date().toISOString().slice(0, 10),
          guide: "",
        });
      }

      setStep(2);
    } catch (e: any) {
      setError("No se pudo validar la factura. Intenta de nuevo.");
    } finally {
      setValidating(false);
    }
  }

  /* ================= DRAFT AUTO (PASO 2) ================= */
  useEffect(() => {
    if (step === 2 && header) {
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
  }, [step, header]);

  /* ================= UI ================= */
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">
          Paso {step} de 3
        </h1>

        {/* ================= PASO 1 ================= */}
        {step === 1 && (
          <>
            <label>Factura</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
            />

            {error && (
              <div className="text-red-600 mt-2">
                {error}
              </div>
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

        {/* ================= PASO 2 ================= */}
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
                <div className="text-gray-400">
                  No hay cajas aún
                </div>
              )}

              {lines.map((l, i) => (
                <div key={i}>
                  Caja #{l.box_no} — {l.code} — {l.pounds} lbs
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

        {/* ================= PASO 3 ================= */}
        {step === 3 && (
          <>
            <p className="font-bold">Resumen</p>
            <p>Total líneas: {lines.length}</p>

            {lines.length > 0 && (
              <button
                className="mt-4 bg-green-700 text-white px-4 py-2 rounded w-full"
              >
                Finalizar Packing
              </button>
            )}
          </>
        )}
      </div>

      <BoxesWizardModal
        open={openBoxes}
        onClose={() => setOpenBoxes(false)}
      />
    </div>
  );
}
