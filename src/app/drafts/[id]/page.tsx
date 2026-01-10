"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJSON } from "@/lib/fetchJSON";
import { getRole } from "@/lib/role";

type Draft = {
  id: string;
  client_code: string;
  internal_ref: string;
  status: string;
};

type DraftResponse = {
  ok: boolean;
  draft: Draft;
  lines: any[];
};

export default function DraftEditorPage({
  params,
}: {
  params: { draftId: string };
}) {
  const router = useRouter();
  const role = getRole() ?? "proceso";

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [lines, setLines] = useState<any[]>([]);

  /* ================= CARGAR DRAFT ================= */
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchJSON<DraftResponse>(
          `/api/packing-drafts/${params.draftId}`
        );

        if (!data.ok) throw new Error("Draft inválido");

        setDraft(data.draft);
        setLines(data.lines ?? []);
      } catch (e) {
        console.error(e);
        alert("No se pudo cargar el draft");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params.draftId]);

  /* ================= GUARDAR ================= */
  async function saveDraft() {
    if (!draft) return;

    try {
      const res = await fetch("/api/packing-drafts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_id: draft.id,
          header: {
            client_code: draft.client_code,
            internal_ref: draft.internal_ref,
          },
          lines,
          status: draft.status ?? "PROCESS",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "Error al guardar");
      }

      alert("Draft guardado correctamente");
    } catch (e: any) {
      alert(e.message);
    }
  }

  /* ================= CONTINUAR EN WIZARD ================= */
  function continuar() {
    router.push(`/packings/new?draft=${draft?.id}`);
  }

  if (loading) return <div className="p-6">Cargando draft…</div>;
  if (!draft) return <div className="p-6">No encontrado</div>;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Editar Draft</h1>

      <div className="border rounded p-4 bg-white space-y-2">
        <div>
          <b>Cliente:</b> {draft.client_code}
        </div>
        <div>
          <b>Referencia:</b> {draft.internal_ref}
        </div>
        <div>
          <b>Status:</b> {draft.status}
        </div>
      </div>

      {/* LÍNEAS */}
      <div>
        <h2 className="font-bold mb-2">Líneas</h2>

        {lines.map((l, i) => (
          <div
            key={i}
            className="border rounded p-2 mb-2 flex gap-2 items-center"
          >
            <input
              className="border rounded px-2 py-1 flex-1"
              value={l.description_en ?? ""}
              placeholder="Especie"
              onChange={(e) => {
                const copy = [...lines];
                copy[i].description_en = e.target.value;
                setLines(copy);
              }}
            />

            <input
              className="border rounded px-2 py-1 w-24"
              value={l.size ?? ""}
              placeholder="Size"
              onChange={(e) => {
                const copy = [...lines];
                copy[i].size = e.target.value;
                setLines(copy);
              }}
            />

            <input
              type="number"
              className="border rounded px-2 py-1 w-24"
              value={l.pounds ?? 0}
              onChange={(e) => {
                const copy = [...lines];
                copy[i].pounds = Number(e.target.value);
                setLines(copy);
              }}
            />
          </div>
        ))}

        <button
          className="border px-3 py-1 rounded"
          onClick={() =>
            setLines([
              ...lines,
              { description_en: "", size: "", pounds: 0 },
            ])
          }
        >
          + Agregar línea
        </button>
      </div>

      {/* BOTONES */}
      <div className="flex gap-3 pt-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={saveDraft}
        >
          Guardar
        </button>

        {(role === "proceso" || role === "admin") && (
          <button
            className="px-4 py-2 bg-green-600 text-white rounded"
            onClick={continuar}
          >
            Continuar en Packing
          </button>
        )}
      </div>
    </main>
  );
}
