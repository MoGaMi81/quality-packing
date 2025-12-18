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
    lines,
    header,
    setHeader,
    loadFromDB,
    reset,
  } = usePackingStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [invoice, setInvoice] = useState("");
  const [clientCode, setClientCode] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [guide, setGuide] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openBoxes, setOpenBoxes] = useState(false);

  useEffect(() => {
    if (open) {
      reset();
      setStep(1);
      setInvoice("");
      setClientCode("");
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
        `/api/packing/by-invoice/${encodeURIComponent(invoice.trim())}`
      );

      if (r?.packing) {
        // 👉 continuar draft
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
        // 👉 nuevo packing
        setHeader({
          invoice_no: invoice.trim().toUpperCase(),
          client_code: clientCode.trim(),
          date,
          guide,
        });
      }

      setStep(2);
    } catch {
      setError("Error validando factura");
    } finally {
      setValidating(false);
    }
  }

  /* ================= UI ================= */

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Paso {step} de 3</h1>

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

            <button onClick={onClose} className="mt-4 text-red-600 underline w-full">
              Cancelar
            </button>
          </>
        )}

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
              {lines.map((l, i) => (
                <div key={i}>
                  Caja #{l.box_no} — {l.code} — {l.pounds} lbs
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(3)}
              className="mt-4 bg-blue-700 text-white px-4 py-2 rounded w-full"
            >
              Continuar
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <p className="font-bold">Resumen</p>
            <p>Total líneas: {lines.length}</p>

            <button
              className="mt-4 bg-green-700 text-white px-4 py-2 rounded w-full"
            >
              Finalizar Packing
            </button>
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
