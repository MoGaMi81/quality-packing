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

export default function FacturacionPendingPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJSON<{ ok: boolean; rows: Row[] }>("/api/facturacion/pending")
      .then((r) => {
        if (r.ok) setRows(r.rows);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <main className="p-6">Cargando…</main>;
  }

  return (
    <main className="p-6 space-y-4">
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
        <div>No hay pendientes.</div>
      )}

      {rows.map((r) => (
        <div
          key={r.id}
          className="border rounded p-4 flex justify-between"
        >
          <div>
            <div><b>Cliente:</b> {r.client_code}</div>
            <div className="text-sm text-gray-500">
              {new Date(r.created_at).toLocaleString()}
            </div>
            <div className="text-sm">
              {r.total_boxes} cajas · {r.total_lbs} lbs
            </div>
          </div>

          <Link
            href={`/facturacion/${r.id}`}
            className="px-4 py-2 border rounded"
          >
            Facturar
          </Link>
        </div>
      ))}
    </main>
  );
}
