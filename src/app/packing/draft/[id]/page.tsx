"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AddBoxModal from "@/components/AddBoxModal";
import AddRangeModal from "@/components/AddRangeModal";
import AddCombinedModal from "@/components/AddCombinedModal";

export default function DraftEditor({ params }: { params: { id: string } }) {
  const draftId = Number(params.id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<any>(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [openRange, setOpenRange] = useState(false);
  const [openComb, setOpenComb] = useState(false);

  const loadDraft = async () => {
    setLoading(true);
    const r = await fetch(`/api/drafts/get/${draftId}`);
    const data = await r.json();

    if (data.ok) {
      setDraft(data.draft);
    } else {
      alert("Draft no encontrado");
      router.push("/drafts");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDraft();
  }, []);

  const saveDraft = async (updated: any) => {
    const r = await fetch(`/api/drafts/update/${draftId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    const data = await r.json();

    if (!data.ok) alert("Error guardando");
  };

  const addLine = (item: any) => {
    const updated = {
      ...draft,
      lines: [...draft.lines, item],
      updated_at: new Date().toISOString(),
    };
    setDraft(updated);
    saveDraft(updated);
  };

  const deleteBox = (boxNo: number) => {
    const filtered = draft.lines.filter((l: any) => l.box_no !== boxNo);

    const updated = {
      ...draft,
      lines: filtered,
      updated_at: new Date().toISOString(),
    };

    setDraft(updated);
    saveDraft(updated);
  };

  if (loading) return <div className="p-6">Cargando draft...</div>;
  if (!draft) return null;

  // Agrupar por box
  const sorted = [...draft.lines].sort((a, b) => a.box_no - b.box_no);

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">

      {/* Encabezado del Draft */}
      <div className="p-4 bg-white rounded-xl shadow space-y-2">
        <h2 className="text-xl font-bold">Draft #{draftId}</h2>
        <p className="text-gray-600">
          Cliente: <b>{draft.client_code}</b>
        </p>

        <p className="text-sm text-gray-500">
          Última actualización: {new Date(draft.updated_at).toLocaleString()}
        </p>
      </div>

      {/* Botones */}
      <section className="flex gap-3">
        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={() => setOpenAdd(true)}
        >
          + Simple
        </button>

        <button
          className="px-4 py-2 bg-gray-200 rounded"
          onClick={() => setOpenRange(true)}
        >
          + Rango
        </button>

        <button
          className="px-4 py-2 bg-gray-200 rounded"
          onClick={() => setOpenComb(true)}
        >
          + Combinada
        </button>

        {/* FINALIZAR (solo Admin o Facturación) */}
        <button
          className="ml-auto px-4 py-2 bg-green-600 text-white rounded"
          onClick={() => router.push(`/packing/finalize/${draftId}`)}
        >
          Finalizar →
        </button>
      </section>

      {/* TABLA */}
      <section className="p-4 bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full border rounded bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Caja</th>
              <th className="p-2 border">Item</th>
              <th className="p-2 border">Form</th>
              <th className="p-2 border">Size</th>
              <th className="p-2 border text-right">Lbs</th>
              <th className="p-2 border"></th>
            </tr>
          </thead>

          <tbody>
            {sorted.map((l, i) => (
              <tr key={i}>
                <td className="p-2 border">{l.box_no}</td>
                <td className="p-2 border">{l.description_en}</td>
                <td className="p-2 border">{l.form}</td>
                <td className="p-2 border">{l.size}</td>
                <td className="p-2 border text-right">{l.pounds}</td>

                <td className="p-2 border text-center">
                  <button
                    className="text-red-500 underline text-sm"
                    onClick={() => deleteBox(l.box_no)}
                  >
                    eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Modales */}
      <AddBoxModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onAdded={(item) =>
          addLine({
            box_no: sorted.length ? sorted[sorted.length - 1].box_no + 1 : 1,
            ...item,
          })
        }
      />

      <AddRangeModal
        open={openRange}
        onClose={() => setOpenRange(false)}
        onAdded={(items) => {
          let next = sorted.length ? sorted[sorted.length - 1].box_no + 1 : 1;
          items.forEach((it) => {
            addLine({ box_no: next++, ...it });
          });
        }}
      />

      <AddCombinedModal
        open={openComb}
        onClose={() => setOpenComb(false)}
        onAdded={(items) => {
          const next = sorted.length ? sorted[sorted.length - 1].box_no + 1 : 1;
          items.forEach((it) => addLine({ box_no: next, ...it }));
        }}
      />
    </main>
  );
}
