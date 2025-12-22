"use client";

import { useEffect, useState } from "react";
import { PackingLine, usePackingStore } from "@/store/packingStore";
import BoxesWizardModal from "@/components/BoxesWizardModal";
import { fetchJSON } from "@/lib/fetchJSON";
import { useRouter } from "next/navigation";
import router from "next/router";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function NewPackingWizard({ open, onClose }: Props) {
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
  const [openBoxes, setOpenBoxes] = useState(false);
  const [client_code] = useState("");
const [date] = useState(
  new Date().toISOString().slice(0, 10)
);
const [guide, setGuide] = useState("");


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

  /* ================= AUTOSAVE DRAFT ================= */
  useEffect(() => {
    if (step === 2 && header) {
      fetchJSON("/api/packings/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packing_id: packing_id ?? null,
          header,
          lines,
        }),
      }).then((r) => {
        if (r?.packing_id && !packing_id) {
          usePackingStore.setState({ packing_id: r.packing_id });
        }
      });
    }
  }, [step, header, lines, packing_id]);

  /* ================= AGRUPAR POR CAJA ================= */
  const boxes = lines.reduce<Record<number, PackingLine[]>>((acc, l) => {
    if (!acc[l.box_no]) acc[l.box_no] = [];
    acc[l.box_no].push(l);
    return acc;
  }, {});

  /* ================= FINALIZAR ================= */
  const finalize = async () => {
  console.log("FINALIZE CLICK");
  console.log("packing_id:", packing_id);

  if (!packing_id) {
    alert("Packing inválido");
    return;
  }

  const res = await fetch("/api/packing/finalize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      packing_id,
      header: {
        invoice_no: invoice,
        client_code,
        date,
        guide,
      },
      lines,
    }),
  });

  const data = await res.json();
  console.log("FINALIZE RESPONSE:", data);

  if (!data.ok) {
    alert(data.error);
    return;
  }

  router.push("/packing");
};  

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

              <div className="mt-4 text-sm max-h-56 overflow-auto border p-3 rounded">
                {Object.entries(boxes).map(([boxNo, items]) => (
                  <div key={boxNo} className="mb-3">
                    <div className="font-semibold">
                      Caja #{boxNo}
                    </div>
                    {items.map((l, i) => (
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
          {step === 3 && (() => {
            const byCode = Object.values(
              lines.reduce((acc: any, l) => {
                if (!acc[l.code]) {
                  acc[l.code] = {
                    ...l,
                    boxes: new Set<number>(),
                    total_lbs: 0,
                  };
                }
                acc[l.code].boxes.add(l.box_no);
                acc[l.code].total_lbs += l.pounds;
                return acc;
              }, {})
            );

            const totalCajas = new Set(lines.map(l => l.box_no)).size;
            const totalLbs = lines.reduce((s, l) => s + l.pounds, 0);

            return (
              <>
                <p className="text-xl font-bold mb-3">Resumen</p>

                <div className="border rounded p-3 space-y-4 max-h-[320px] overflow-auto">
                  {byCode.map((g: any, i) => (
                    <div key={i}>
                      <div className="font-semibold">
                        {g.code} — {g.description_en}
                      </div>
                      <div className="text-sm">{g.form} {g.size}</div>
                      <div className="italic text-sm">{g.scientific_name}</div>
                      <div>
                        Cajas: {g.boxes.size} · Total lbs: <b>{g.total_lbs}</b>
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
  className="bg-green-700 text-white px-4 py-2 rounded w-full"
>
  Finalizar Packing
</button>

                </div>
              </>
            );
          })()}

        </div>
      </div>

      <BoxesWizardModal
        open={openBoxes}
        onClose={() => setOpenBoxes(false)}
      />
    </>
  );
}


