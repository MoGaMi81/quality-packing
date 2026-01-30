"use client";

import { useEffect, useState } from "react";
import { usePackingStore } from "@/store/packingStore";
import BoxesWizardModal from "@/components/BoxesWizardModal";
import { useRouter, useSearchParams } from "next/navigation";
import { groupBoxes } from "@/lib/groupBoxes";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function NewPackingWizard({ open, onClose }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("draft");

  const {
    header,
    lines,
    setHeader,
    setLines,
    reset,
  } = usePackingStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);

  // Draft
  const [draft_id, setDraftId] = useState<string | null>(null);

  // Boxes
  const [openBoxes, setOpenBoxes] = useState(false);
  const [editingBox, setEditingBox] = useState<number | null>(null);

  /* ================= RESET ================= */
  useEffect(() => {
    if (!open) return;

    reset();
    setError(null);

    if (!id) {
      setDraftId(null);
      setStep(1);
    }
  }, [open, id, reset]);

  if (!open) return null;

  /* ================= PASO 1 ================= */
  function goStep1() {
    if (!header?.client_code || !header?.internal_ref) {
      setError("Cliente e identificador son obligatorios");
      return;
    }

    setError(null);
    setStep(2);
  }

  /* ================= GUARDAR BORRADOR ================= */
  async function saveDraftAndExit() {
    if (!header?.client_code || !header?.internal_ref) {
      alert("Cliente e identificador incompletos");
      return;
    }

    // 🔑 CAMBIO CLAVE: leer estado REAL del store
    const { lines: storeLines } = usePackingStore.getState();

    if (!storeLines || storeLines.length === 0) {
      alert("No hay líneas para guardar");
      return;
    }

    try {
      const res = await fetch("/api/packing-drafts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_id: draft_id ?? null,
          header: {
            client_code: header.client_code,
            internal_ref: header.internal_ref,
          },
          lines: storeLines,
          status: "PROCESS",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error || "Error al guardar borrador");
        return;
      }

      if (data.draft_id && typeof data.draft_id === "string") {
        setDraftId(data.draft_id);
      }

      alert("Borrador guardado correctamente");
      router.replace("/drafts");
    } catch (e) {
      console.error(e);
      alert("Error inesperado al guardar borrador");
    }
  }

  /* ================= CARGAR DRAFT ================= */
  useEffect(() => {
    if (!open || !id) return;

    async function loadDraft() {
      const r = await fetch(`/api/packing-drafts/${id}`, {
        cache: "no-store",
      });
      const data = await r.json();

      if (!data.ok) return;

      setHeader({
        client_code: data.draft.client_code,
        internal_ref: data.draft.internal_ref,
        date: new Date().toISOString().slice(0, 10),
      });

      setLines(data.lines ?? []);
      setDraftId(id);
      setStep(2);
    }

    loadDraft();
  }, [open, id, setHeader, setLines]);

  /* ================= FINALIZAR PROCESO ================= */
  async function finishProcess() {
    if (!draft_id) return;

    if (!confirm("¿Confirmas que el proceso está completo?")) return;

    const res = await fetch(
      `/api/packing-drafts/${draft_id}/finish-process`,
      { method: "PATCH" }
    );

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(data?.error || "No se pudo finalizar");
      return;
    }

    alert("Proceso finalizado. Enviado a facturación.");
    router.replace("/drafts");
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
            Proceso · Paso {step} de 3
          </h1>

          {/* ===== PASO 1 ===== */}
          {step === 1 && (
            <>
              <label className="block font-semibold mb-1">
                Cliente (código)
              </label>
              <input
                className="border rounded px-3 py-2 w-full mb-3"
                value={header?.client_code ?? ""}
                onChange={(e) =>
                  setHeader({
                    ...header!,
                    client_code: e.target.value.toUpperCase(),
                  })
                }
              />

              <label className="block font-semibold mb-1">
                Identificador interno
              </label>
              <input
                className="border rounded px-3 py-2 w-full"
                value={header?.internal_ref ?? ""}
                onChange={(e) =>
                  setHeader({
                    ...header!,
                    internal_ref: e.target.value.toUpperCase(),
                  })
                }
              />

              {error && <div className="text-red-600 mt-2">{error}</div>}

              <button
                onClick={goStep1}
                className="mt-4 bg-black text-white px-4 py-2 rounded w-full"
              >
                Continuar
              </button>
            </>
          )}

          {/* ===== PASO 2 ===== */}
          {step === 2 && (
            <>
              <p className="mb-3 text-sm">
                <b>Cliente:</b> {header?.client_code} <br />
                <b>Referencia:</b> {header?.internal_ref}
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
                    className="mb-2 border rounded p-2 cursor-pointer hover:bg-gray-50"
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
                      <div key={i} className="text-sm ml-4">
                        🐟 {l.description_en} {l.form} {l.size} – {l.pounds} lbs
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

              <div className="text-sm mb-3">
                <b>Total cajas:</b> {totalCajas} &nbsp;&nbsp;
                <b>Total lbs:</b> {totalLbs}
              </div>

              <div className="border rounded p-2 max-h-[400px] overflow-y-auto mb-4">
                {grouped.map((box) => (
                  <div key={box.box_no} className="mb-2">
                    <div className="font-semibold">
                      Caja #{box.box_no}
                      {box.isCombined && " (MX)"}
                    </div>

                    {box.lines.map((l, i) => (
                      <div key={i} className="text-sm ml-4">
                        {l.description_en} {l.form} {l.size} – {l.pounds} lbs
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 border rounded px-4 py-2"
                >
                  Regresar
                </button>

                
              </div>
            </>
          )}
        </div>
      </div>

      <BoxesWizardModal
        open={openBoxes}
        onClose={() => {
          setOpenBoxes(false);
          setEditingBox(null);
        }}
      />
    </>
  );
}
