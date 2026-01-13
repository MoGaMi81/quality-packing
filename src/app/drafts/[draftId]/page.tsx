"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJSON } from "@/lib/fetchJSON";
import { getRole } from "@/lib/role";
import { resolveClientName } from "@/lib/resolveClient";

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
        alert("No se pudo cargar el draft");
        router.push("/drafts");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params.draftId, router]);

  async function saveDraft() {
    if (!draft) return;

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
      alert(data?.error || "Error al guardar");
      return;
    }

    alert("Draft guardado correctamente");
  }

  if (loading) return <div className="p-6">Cargando draft…</div>;
  if (!draft) return null;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/drafts")}
          className="px-3 py-1 border rounded"
        >
          ← Drafts
        </button>

        <h1 className="text-3xl font-bold">Editar Draft</h1>
      </div>

      <div className="border rounded p-4 bg-white space-y-2">
        <div>
          <b>Cliente:</b>{" "}
          {draft.client_code} – {resolveClientName(draft.client_code)}
        </div>
        <div><b>Referencia:</b> {draft.internal_ref}</div>
        <div><b>Status:</b> {draft.status}</div>
      </div>

      {/* LÍNEAS (manual por ahora, OK) */}

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
            onClick={() => router.push(`/packings/new?draft=${draft.id}`)}
          >
            Continuar en Packing
          </button>
        )}
      </div>
    </main>
  );
}
