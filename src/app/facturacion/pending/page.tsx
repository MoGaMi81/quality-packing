"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchJSON } from "@/lib/fetchJSON";

type Row = {
  id: string;
  client_code: string;
  internal_ref: string;
  date: string;
};

export default function FacturacionPending() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchJSON<{ ok: boolean; rows: Row[] }>("/api/packings/drafts")
      .then((r) => r.ok && setRows(r.rows))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="p-6">Cargando…</main>;

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

      {rows.length === 0 && <div>No hay pendientes.</div>}

      {rows.map((r) => (
        <div key={r.id} className="border rounded p-4 flex justify-between">
          <div>
            <div><b>Cliente:</b> {r.client_code}</div>
            <div><b>Referencia:</b> {r.internal_ref}</div>
            <div className="text-sm text-gray-500">{r.date}</div>
          </div>
          <Link
            className="px-4 py-2 border rounded"
            href={`/facturacion/${r.id}`}
          >
            Abrir
          </Link>
        </div>
      ))}
    </main>
  );
}
