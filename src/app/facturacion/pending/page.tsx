"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchJSON } from "@/lib/fetchJSON";

type Row = {
  id: string;
  client_code: string;
  created_at: string;
  total_boxes: number;
  total_lbs: number;
};

export default function FacturacionPending() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchJSON<{ ok: boolean; rows: Row[] }>(
      "/api/facturacion/pending"
    )
      .then((r) => r.ok && setRows(r.rows))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="p-6">Cargando…</main>;

  return (
    <main className="p-6 space-y-4 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.replace("/facturacion")}
          className="px-3 py-1 border rounded"
        >
          ← Volver
        </button>

        <h1 className="text-2xl font-bold">Pendientes de facturar</h1>

        <div />
      </div>

      {rows.length === 0 && (
        <div className="text-gray-500">No hay pendientes.</div>
      )}

      {rows.map((r) => (
        <div
          key={r.id}
          className="border rounded-xl p-4 flex justify-between items-center"
        >
          <div>
            <div className="font-semibold">
              Cliente: {r.client_code}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(r.created_at).toLocaleString()}
            </div>
            <div className="text-sm mt-1">
              {r.total_boxes} cajas · {r.total_lbs} lbs
            </div>
          </div>

          <Link
            className="px-4 py-2 bg-blue-700 text-white rounded"
            href={`/facturacion/${r.id}`}
          >
            Facturar
          </Link>
        </div>
      ))}
    </main>
  );
}
