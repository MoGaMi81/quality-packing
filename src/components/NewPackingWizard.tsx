"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { usePackingStore } from "@/store/packingStore";
import BoxesWizardModal from "@/components/BoxesWizardModal";
import { useRouter, useSearchParams } from "next/navigation";
import { groupBoxes } from "@/lib/groupBoxes";
import { useSpeciesCatalog } from "@/hooks/useSpeciesCatalog";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function NewPackingWizard({ open, onClose }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("draft");
  const { items } = useSpeciesCatalog();

  const {
    header,
    lines,
    setHeader,
    setLines,
    reset,
    removeBox,
    removeLine,
    updateLine,
  } = usePackingStore();

  const [clientName, setClientName] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);
  const [draft_id, setDraftId] = useState<string | null>(null);
  const [openBoxes, setOpenBoxes] = useState(false);
  const [editingBox, setEditingBox] = useState<number | null>(null);
  const [internalRef, setInternalRef] = useState("");
const [guideValue, setGuideValue] = useState("");
  const [clients, setClients] = useState<{ code: string; name: string }[]>([]);

  const safeHeader = header ?? {
  client_code: "",
  internal_ref: "",
};
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

  /* ================= CARGAR NOMBRE CLIENTE ================= */
  useEffect(() => {
  if (!header?.client_code) {
    setClientName(null);
    return;
  }

  const match = clients.find(
    (c) => c.code === header.client_code
  );

  setClientName(match?.name ?? null);
}, [header?.client_code, clients]);

  /* ================= GUARDAR BORRADOR ================= */
  async function saveDraftAndExit() {
    if (!safeHeader.client_code || !safeHeader.internal_ref) {
      alert("Cliente e identificador incompletos");
      return;
    }

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
            client_code: safeHeader.client_code,
            internal_ref: safeHeader.internal_ref,
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
  client_name: data.draft.client_name ?? "",
  internal_ref: data.draft.internal_ref,
  date: new Date().toISOString().slice(0, 10),
      });

      setLines(data.lines ?? []);
      setDraftId(id);
      setStep(2);
    }

    loadDraft();
  }, [open, id, setHeader, setLines]);

  /* ================= FINALIZAR ================= */
  async function finishProcess() {
  if (!draft_id) return;

  if (!confirm("¿Confirmas que el proceso está completo?")) return;

  const { lines: storeLines } = usePackingStore.getState();

  if (!storeLines || storeLines.length === 0) {
    alert("No hay líneas para finalizar.");
    return;
  }

  try {
    // 1️⃣ Guardar borrador completo
    const saveRes = await fetch("/api/packing-drafts/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft_id,
        header: {
          client_code: safeHeader.client_code,
          internal_ref: safeHeader.internal_ref,
        },
        lines: storeLines,
        status: "PROCESS",
      }),
    });

    const saveData = await saveRes.json();

    if (!saveRes.ok || !saveData?.ok) {
      alert(saveData?.error || "Error al guardar antes de finalizar");
      return;
    }

    // 2️⃣ Cambiar estado a PROCESS_DONE
    const finishRes = await fetch(
      `/api/packing-drafts/${draft_id}/finish-process`,
      { method: "PATCH" }
    );

    const finishData = await finishRes.json();

    if (!finishRes.ok || !finishData.ok) {
      alert(finishData?.error || "No se pudo finalizar");
      return;
    }

    alert("Proceso finalizado correctamente.");
    router.replace("/drafts");

  } catch (err) {
    console.error(err);
    alert("Error inesperado al finalizar");
  }
}

  /* ================= DERIVADOS ================= */
  const grouped = groupBoxes(lines);
  const totalCajas = grouped.length;
  const totalLbs = grouped.reduce((s, b) => s + b.total_lbs, 0);

  function setOpenClientModal(arg0: boolean): void {
    throw new Error("Function not implemented.");
  }

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

            <select
              className="border rounded px-3 py-2 w-full mb-3"
            value={header?.client_code ?? ""}
  onChange={(e) => {
    const selected = clients.find(
      c => c.code === e.target.value
    );

    setHeader({
      ...(header ?? {}),
      client_code: e.target.value,
      client_name: selected?.name ?? "",   // 👈 IMPORTANTE
    });
  }}
>
              <option value="">Seleccionar cliente</option>
              {clients.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
  type="button"
  onClick={() => setOpenClientModal(true)}
  className="text-blue-600 text-sm mb-3"
>
  + Nuevo cliente
</button>

              <label className="block font-semibold mb-1">
                Identificador interno
              </label>
              <input
                className="border rounded px-3 py-2 w-full"
                value={header?.internal_ref ?? ""}
                onChange={(e) =>
                  setHeader({
                    ...(header ?? {}),
                    internal_ref: e.target.value.toUpperCase(),
                  })
                }
              />

              {error && (
                <div className="text-red-600 mt-2">{error}</div>
              )}

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
      <b>Cliente:</b>{" "}
        {header?.client_name ?? "—"} <br />
      <b>Referencia:</b>{" "}
      {header?.internal_ref ?? ""}
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
          className="mb-2 border rounded p-3 hover:bg-gray-50"
        >
          <div className="font-semibold flex items-center justify-between mb-2">
            <div>
              Caja #{box.box_no}
              {box.isCombined && " (Combinada)"}
            </div>

          </div>

          {box.lines.map((l, i) => {
            const globalIndex = lines.findIndex(
              (orig) =>
                orig.box_no === l.box_no &&
                orig.description_en === l.description_en &&
                orig.form === l.form &&
                orig.size === l.size &&
                orig.pounds === l.pounds
            );

            return (
              <div
                key={i}
                className="text-sm ml-4 flex items-center justify-between gap-4 mb-2"
              >
                <div className="flex items-center gap-3 flex-wrap">

                  {/* 🔵 ESPECIE editable */}
                  <select
  value={l.code ?? ""}
  onChange={(e) => {
    const selected = items.find(
      (s) => s.code === e.target.value
    );
    if (!selected) return;

    updateLine(globalIndex, {
      code: selected.code,
      description_en: selected.description_en,
      scientific_name: selected.scientific_name ?? null,
      form: selected.form,
      size: selected.size,
    });
  }}
  className="border rounded px-2 py-1 text-sm"
>
  {items.map((sp) => (
    <option key={sp.code} value={sp.code}>
      {sp.code} - {sp.description_en}
    </option>
  ))}
</select>

                  {/* SIZE */}
                  <span className="text-gray-600">
                    {l.form} {l.size}
                  </span>

                  {/* 🔵 LBS editable */}
                  <input
                    type="number"
                    value={l.pounds}
                    onChange={(e) =>
                      updateLine(globalIndex, {
                        pounds: Number(e.target.value),
                      })
                    }
                    className="w-20 border rounded px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-gray-500">lbs</span>
                </div>

                {/* ❌ Botón eliminar línea */}
                <button
  onClick={() => {
    if (box.lines.length === 1) {
      if (confirm("¿Eliminar caja completa?"))
        removeBox(box.box_no as number);
    } else {
      if (confirm("¿Eliminar solo esta línea?"))
        removeLine(globalIndex);
    }
  }}
  className="text-red-600 text-xs hover:underline flex items-center gap-1"
>
  <TrashIcon className="w-4 h-4" />
  Eliminar
</button>

              </div>
            );
          })}

          <div className="ml-4 text-xs text-gray-600 mt-2">
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
              <p className="text-xl font-bold mb-3">
                Resumen
              </p>

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

                <button
                  onClick={finishProcess}
                  className="flex-1 bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Finalizar Proceso
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