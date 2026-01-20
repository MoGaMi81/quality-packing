"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";
import { useRouter } from "next/navigation";

export default function FacturacionDetail({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const draftId = params.id;

  const [draft, setDraft] = useState<any>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [guide, setGuide] = useState("");

  useEffect(() => {
    fetchJSON(`/api/packing-drafts/${draftId}`).then((res) => {
      if (res?.ok) {
        setDraft(res.draft);
      }
    });
  }, [draftId]);

  if (!draft) return <main className="p-6">Cargando…</main>;

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Facturación</h1>

      <div className="border rounded p-4">
        <div>
          <b>Cliente:</b> {draft.client_code}
        </div>
        <div>
          <b>Referencia:</b> {draft.internal_ref}
        </div>
      </div>

      <div className="space-y-2">
        <label>Factura</label>
        <input
          className="border rounded px-3 py-2 w-full"
          value={invoiceNo}
          onChange={(e) => setInvoiceNo(e.target.value)}
        />

        <label>Guía</label>
        <input
          className="border rounded px-3 py-2 w-full"
          value={guide}
          onChange={(e) => setGuide(e.target.value)}
        />
      </div>

      <button
        className="bg-black text-white px-4 py-2 rounded"
        onClick={async () => {
          if (!invoiceNo || !guide) {
            alert("Factura y guía son obligatorias");
            return;
          }

          const r = await fetch(
            `/api/packing-drafts/${draftId}/finish-facturation`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                invoice_no: invoiceNo,
                guide,
              }),
            }
          );

          const data = await r.json();
          if (!r.ok || !data.ok) {
            alert(data?.error || "Error al facturar");
            return;
          }

          router.replace("/drafts");
        }}
      >
        Confirmar facturación
      </button>
    </main>
  );
}
