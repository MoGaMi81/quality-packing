"use client";

import { useEffect, useState } from "react";
import { usePackingStore } from "@/store/packingStore";
import BoxesWizardModal from "@/components/BoxesWizardModal";
import { fetchJSON } from "@/lib/fetchJSON";
import { useRouter } from "next/navigation";
import { groupBoxes } from "@/lib/groupBoxes";
import SimpleRangeWizardModal from "@/components/SimpleRangeWizardModal";

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
  
  const [editingBox, setEditingBox] = useState<number | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [invoice, setInvoice] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openBoxes, setOpenBoxes] = useState(false);
  const [openSimpleRange, setOpenSimpleRange] = useState(false);

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
              onClick={() => setOpenSimpleRange(true)}
               className="bg-black text-white px-4 py-2 rounded w-full"
>
              + Agregar Simple / Rango
               </button>

              <div className="mt-4 border rounded p-3 max-h-56 overflow-auto">
                {grouped.map((box) => (
              <div
                key={box.box_no}
                className="mb-3 border rounded p-2 cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  setEditingBox(box.box_no);
                  setOpenBoxes(true);
                }}
              >
                    <div className="font-semibold">
                      Caja #{box.box_no}
                      {box.isCombined && " (Combinada)"}
                    </div>

                    {box.lines.map((l, i) => (
                      <div key={i} className="ml-4">
                        {l.code} — {l.pounds} lbs
                      </div>
                    ))}
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

          {/* ===== PASO 3 ===== */}
          {step === 3 && (
            <>
              <p className="text-xl font-bold mb-3">Resumen</p>

              <div className="border rounded p-3 space-y-4 max-h-[320px] overflow-auto">
                {grouped.map((box) => (
                  <div key={box.box_no}>
                    <div className="font-semibold">
                      Caja #{box.box_no}
                      {box.isCombined && " (Combinada)"}
                    </div>

                    {box.lines.map((l, i) => (
                      <div key={i} className="ml-4 text-sm">
                        {l.code} — {l.pounds} lbs
                      </div>
                    ))}

                    <div className="ml-4 font-semibold">
                      Total caja: {box.total_lbs} lbs
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <b>Total cajas:</b> {totalCajas}<br />
                <b>Total lbs:</b> {totalLbs}
              </div>

              <div className="flex gap-3 mt-6">
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

      <SimpleRangeWizardModal
  open={openSimpleRange}
  onClose={() => setOpenSimpleRange(false)}
/>
           <BoxesWizardModal
         open={openBoxes}
         boxNo={editingBox}   // 🔴 ESTE ERA EL FALTANTE
        onClose={() => {
          setOpenBoxes(false);
          setEditingBox(null);
        }}
      />
    </>
  );
}



