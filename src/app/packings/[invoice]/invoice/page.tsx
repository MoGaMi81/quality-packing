// src/app/packings/[invoice]/invoice/page.tsx
"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";
import { getRole } from "@/lib/role";

export default function InvoicePage({ params }: { params: { invoice: string } }) {
  const role = getRole();
  const invoice = params.invoice.toUpperCase();
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetchJSON(`/api/packings/by-invoice/${invoice}`);
      setData(res.packing);
    })();
  }, [invoice]);

  if (!data) return <main className="p-6">Cargando…</main>;

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-4">

      {role === "facturacion" && (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-3 rounded">
          <strong>Facturación – Trámite Aduanal</strong>
        </div>
      )}

      <h1 className="text-3xl font-bold">Factura {invoice}</h1>

      {/* Aquí irá el resumen final que ya estamos construyendo */}
    </main>
  );
}
