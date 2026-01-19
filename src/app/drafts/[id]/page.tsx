"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJSON } from "@/lib/fetchJSON";
import { getRole } from "@/lib/role";
import { resolveClientName } from "@/lib/resolveClient";
import PricingModal from "@/components/PricingModal";

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
  params: { id: string };
}) {
  const router = useRouter();
  const role = getRole() ?? "proceso";

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [openPricing, setOpenPricing] = useState(false);

  /* ================= LOAD DRAFT ================= */

  async function loadDraft() {
    try {
      const data = await fetchJSON<DraftResponse>(
        `/api/packing-drafts/${params.id}`,
        { cache: "no-store" }
      );

      if (!data.ok) throw new Error("Draft inválido");

      setDraft(data.draft);
      setLines(data.lines ?? []);
    } catch (e) {
      alert("No se pudo cargar el draft");
      router.replace("/drafts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  /* ================= GUARDAR DRAFT ================= */

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
    await loadDraft();
  }

  /* ================= PRICING (ADMIN) ================= */

  async function savePricing(prices: Record<string, number>) {
    if (!draft) return;

    const res = await fetch(
      `/api/packing-drafts/${draft.id}/pricing`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices }),
      }
    );

    const data = await res.json();
    if (!res.ok || !data.ok) {
      alert(data?.error || "Error guardando precios");
      return;
    }

    alert("Precios guardados correctamente");
    setOpenPricing(false);
    await loadDraft();
  }

  /* ================= CONTINUAR ================= */

  function continuar() {
    router.replace(`/packings/new?draft=${draft?.id}`);
  }

  if (loading) return <div className="p-6">Cargando draft…</div>;
  if (!draft) return null;

  const pricingComplete =
    lines.length > 0 && lines.every((l) => l.price && l.price > 0);

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.replace("/drafts")}
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
        <div>
          <b>Referencia:</b> {draft.internal_ref}
        </div>
        <div>
          <b>Status:</b> {draft.status}
        </div>
      </div>

      {/* ACCIONES */}
      <div className="flex gap-3 pt-4 flex-wrap">
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

        {role === "admin" && draft.status === "TO_ADMIN" && (
          <button
            className="px-4 py-2 bg-black text-white rounded"
            onClick={() => setOpenPricing(true)}
          >
            Capturar precios
          </button>
        )}
      </div>

      {!pricingComplete &&
        role === "admin" &&
        draft.status === "TO_ADMIN" && (
          <div className="text-sm text-orange-600">
            ⚠️ Faltan precios por capturar antes de exportar
          </div>
        )}

      {/* PRICING MODAL */}
      <PricingModal
        open={openPricing}
        lines={lines}
        onClose={() => setOpenPricing(false)}
        onSave={savePricing}
      />
    </main>
  );
}
