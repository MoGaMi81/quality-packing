"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PricingModal from "@/components/PricingModal";
import { fetchJSON } from "@/lib/fetchJSON";
import type { PackingLine } from "@/domain/packing/types";

type Packing = {
  id: string;
  invoice_no: string;
  client_code: string;
  client_name?: string | null;
  created_at: string;
  packing_lines?: PackingLine[];
};

export default function PricingPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const packingId = params.id;

  const [packing, setPacking] = useState<Packing | null>(null);
  const [lines, setLines] = useState<PackingLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPricing, setOpenPricing] = useState(false);

  /* ================= LOAD ================= */
  useEffect(() => {
    async function load() {
      try {
        const res = await fetchJSON(`/api/packings/${packingId}`);

        if (!res?.ok || !res?.packing) {
          alert(res?.error || "Packing no encontrado");
          router.replace("/admin");
          return;
        }

        setPacking(res.packing);
        setLines(res.packing.packing_lines ?? []);
      } catch (e) {
        console.error(e);
        alert("Error cargando packing");
        router.replace("/admin");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [packingId, router]);

  if (loading) {
    return <main className="p-6">Cargando pricing…</main>;
  }

  if (!packing) return null;

  /* ================= SAVE PRICES ================= */
  async function savePrices(prices: Record<string, number>) {
    const r = await fetch(`/api/packings/${packingId}/pricing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prices }),
    });

    const data = await r.json();

    if (!r.ok || !data.ok) {
      alert(data?.error || "Error al guardar precios");
      return;
    }

    alert("Pricing guardado correctamente");
    router.replace("/admin");
  }

  const totalLbs = lines.reduce(
    (sum, l) => sum + (l.pounds ?? 0),
    0
  );

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.replace("/admin")}
          className="px-3 py-1 border rounded"
        >
          ← Volver
        </button>

        <h1 className="text-2xl font-bold">Pricing</h1>

        <div />
      </div>

      {/* INFO */}
      <div className="border rounded p-4 space-y-1">
        <div>
          <b>Factura:</b> {packing.invoice_no}
        </div>
        <div>
          <b>Cliente:</b>{" "}
          {packing.client_name || packing.client_code}
        </div>
        <div className="text-sm text-gray-500">
          {new Date(packing.created_at).toLocaleString()}
        </div>
      </div>

      {/* RESUMEN */}
      <div className="border rounded p-4">
        <h2 className="font-semibold mb-2">Resumen</h2>
        <div className="text-sm text-gray-600">
          {lines.length} líneas · {totalLbs.toFixed(2)} lbs
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end">
        <button
          onClick={() => setOpenPricing(true)}
          className="px-5 py-2 bg-green-700 text-white rounded"
        >
          Capturar precios
        </button>
      </div>

      {/* MODAL */}
      <PricingModal
        open={openPricing}
        lines={lines}
        onClose={() => setOpenPricing(false)}
        onSave={savePrices}
      />
    </main>
  );
}
