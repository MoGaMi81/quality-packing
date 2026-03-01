"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchJSON } from "@/lib/fetchJSON";

// 🔑 Tipo Row sin total_boxes ni total_lbs
type Row = {
  id: string;
  client_code: string;
  internal_ref: string;
  created_at: string;
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

  // ✅ Función de logout
  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.replace("/login");
  }

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

        {/* ✅ Botón de cerrar sesión */}
        <button
          onClick={logout}
          className="px-3 py-1 border rounded text-sm bg-red-600 text-white"
        >
          Cerrar sesión
        </button>
      </div>

      {rows.length === 0 && <div>No hay pendientes.</div>}

      {rows.map((r) => (
        <div
          key={r.id}
          className="border rounded p-4 flex justify-between"
        >
          <div>
            <div>
              <b>Cliente:</b> {r.client_code}
            </div>
            <div>
              <b>Referencia:</b> {r.internal_ref}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(r.created_at).toLocaleString()}
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