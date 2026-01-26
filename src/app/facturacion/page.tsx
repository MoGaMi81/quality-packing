"use client";

import { useRouter } from "next/navigation";

export default function FacturacionHome() {
  const router = useRouter();

  return (
    <main className="max-w-xl mx-auto p-6 space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.replace("/facturacion")}
          className="px-3 py-1 border rounded"
        >
          ← Inicio
        </button>

        <h1 className="text-2xl font-bold">Facturación</h1>

        <div />
      </div>

      {/* ACCIONES */}
      <div className="grid gap-4">
        <button
          onClick={() => router.push("/facturacion/pending")}
          className="w-full py-4 bg-blue-700 text-white rounded-xl text-lg font-semibold"
        >
          Facturar packing
        </button>

        <button
          onClick={() => router.push("/facturacion/buscar")}
          className="w-full py-4 bg-gray-800 text-white rounded-xl text-lg font-semibold"
        >
          Buscar factura
        </button>
      </div>

      {/* AYUDA */}
      <div className="text-sm text-gray-500 text-center">
        Facturar packings pendientes o consultar facturas ya emitidas
      </div>
    </main>
  );
}
