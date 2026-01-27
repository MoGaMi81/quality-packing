"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJSON } from "@/lib/fetchJSON";

export default function BuscarFacturaPage() {
  const [invoice, setInvoice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function buscar() {
    setError("");

    if (!invoice.trim()) return;

    setLoading(true);

    try {
      const res = await fetchJSON(
        `/api/facturacion/by-invoice/${invoice.trim()}`
      );

      if (!res.ok) {
        setError(res.error || "Factura no encontrada");
        return;
      }

      // ✅ REDIRECCIÓN ÚNICA
      router.push(`/facturacion/ver/${invoice.trim().toUpperCase()}`);
    } catch (e: any) {
      setError(e.message || "Error al buscar factura");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <button
        onClick={() => router.replace("/facturacion")}
        className="px-3 py-1 border rounded"
      >
        ← Volver
      </button>

      <h1 className="text-2xl font-bold">Buscar factura</h1>

      <div className="flex gap-3">
        <input
          value={invoice}
          onChange={(e) => setInvoice(e.target.value.toUpperCase())}
          placeholder="Número de factura"
          className="border px-3 py-2 rounded w-full"
        />

        <button
          onClick={buscar}
          disabled={loading}
          className="bg-black text-white px-5 py-2 rounded"
        >
          {loading ? "Buscando…" : "Buscar"}
        </button>
      </div>

      {error && <div className="text-red-600">{error}</div>}
    </main>
  );
}
