"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";
import { useRouter } from "next/navigation";

export default function FacturacionDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const packingId = params.id;

  const [packing, setPacking] = useState<any>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [guide, setGuide] = useState("");

  useEffect(() => {
    fetchJSON(`/api/packings/by-id/${packingId}`).then(setPacking);
  }, [packingId]);

  if (!packing) return <main className="p-6">Cargando…</main>;

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Facturación</h1>

      {/* Cliente RESUELTO (aquí luego conectamos catálogo) */}
      <div className="border rounded p-4">
        <div><b>Cliente:</b> {packing.client_code}</div>
        <div><b>Referencia:</b> {packing.internal_ref}</div>
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
          const r = await fetch("/api/packings/bill", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              packing_id: packingId,
              invoice_no: invoiceNo,
              guide,
            }),
          });
          const data = await r.json();
          if (!data.ok) return alert(data.error || "Error");
          router.replace("/facturacion");
        }}
      >
        Confirmar facturación
      </button>
    </main>
  );
}
