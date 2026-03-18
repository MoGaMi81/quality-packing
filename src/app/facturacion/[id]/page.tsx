"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";
import { useRouter } from "next/navigation";

type DraftLine = {
  box_no: number;
  description_en: string;
  form: string;
  size: string;
  pounds: number;
};

type Draft = {
  id: string;
  client_code: string;
  client_name: string;
  guide: string | null;
  created_at: string;
  lines: DraftLine[];
};

export default function FacturacionDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const draftId = params.id;

  const [data, setData] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [guide, setGuide] = useState("");
  const [lastInvoice, setLastInvoice] = useState<string | null>(null);

  useEffect(() => {
    fetchJSON<{ ok: boolean; draft: Draft; lines: DraftLine[] }>(
      `/api/packing-drafts/${draftId}`
    )
      .then((r) => {
        if (!r.ok) throw new Error();
        setData({
          ...r.draft,
          lines: r.lines,
        });
      })
      .catch(() => alert("Error cargando draft"))
      .finally(() => setLoading(false));
  }, [draftId]);

  useEffect(() => {
    async function loadLastInvoice() {
      try {
        const r = await fetch("/api/packings/last-invoice", {
          cache: "no-store",
        });
        const j = await r.json();
        setLastInvoice(j?.invoice_no ?? null);
      } catch {
        setLastInvoice(null);
      }
    }

    loadLastInvoice();
  }, []);

  if (loading) return <main className="p-6">Cargando…</main>;
  if (!data) return <main className="p-6">No encontrado</main>;

  return (
    <main className="p-6 space-y-6">
      <button onClick={() => router.push("/facturacion")} className="px-3 py-1 border rounded">
        ← Volver
      </button>

      <h1 className="text-2xl font-bold">Facturación</h1>

      <div className="border rounded p-4 space-y-2 text-sm">
        <div><b>Cliente:</b> {data.client_name}</div>
        <div><b>Fecha Draft:</b> {new Date(data.created_at).toLocaleDateString()}</div>
      </div>

      <div className="border rounded p-4 space-y-4">
        <div>
          <label className="block text-sm font-semibold">Número de factura</label>

          {lastInvoice && (
            <div className="mb-2 text-sm text-gray-600">
              Última factura usada: <b>{lastInvoice}</b>
            </div>
          )}

          <input
            className="border rounded px-3 py-1 w-full"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold">Guía</label>
          <input
            className="border rounded px-3 py-1 w-full"
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

            const res = await fetch(
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

            const json = await res.json();

            if (!json.ok) {
              alert(json.error || "Error facturando");
              return;
            }

            router.replace("/facturacion");
            router.refresh();
          }}
        >
          Facturar
        </button>
      </div>

      <table className="border-collapse border w-full text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Caja</th>
            <th className="border px-2 py-1">Descripción</th>
            <th className="border px-2 py-1">Form</th>
            <th className="border px-2 py-1">Size</th>
            <th className="border px-2 py-1 text-right">Lbs</th>
          </tr>
        </thead>
        <tbody>
          {data.lines.map((l, i) => (
            <tr key={i}>
              <td className="border px-2 py-1">{l.box_no}</td>
              <td className="border px-2 py-1">{l.description_en}</td>
              <td className="border px-2 py-1">{l.form}</td>
              <td className="border px-2 py-1">{l.size}</td>
              <td className="border px-2 py-1 text-right">{l.pounds}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}