"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRole } from "@/lib/role";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const role = getRole() ?? "proceso";

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/drafts/list");
        const data = await r.json();
        setDrafts(data.drafts || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="p-6">Cargando borradores...</p>;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold text-center">Drafts</h1>

      <div className="text-right">
        <Link
          className="px-4 py-2 bg-blue-600 text-white rounded"
          href="/drafts/new"
        >
          Nuevo Draft
        </Link>
      </div>

      <div className="space-y-3">
        {drafts.map((d) => (
          <div
            key={d.id}
            className="border bg-white rounded-lg p-4 shadow-sm flex justify-between items-center"
          >
            <div>
              <div className="text-lg font-semibold text-gray-800">
                {d.draft_name}
              </div>
              <div className="text-sm text-gray-500">
                Cliente: {d.client_code} · creado {new Date(d.created_at).toLocaleString()}
              </div>
            </div>

            <div className="flex gap-2">
              {/* Editar: proceso + admin */}
              {(role === "proceso" || role === "admin") && (
                <Link
                  href={`/drafts/${d.id}`}
                  className="px-3 py-1 rounded border"
                >
                  Editar
                </Link>
              )}

              {/* Exportar: solo admin */}
              {role === "admin" && (
                <Link
                  href={`/api/export/draft?id=${d.id}`}
                  className="px-3 py-1 rounded bg-gray-800 text-white"
                >
                  Exportar
                </Link>
              )}

              {/* Finalizar: admin + facturacion */}
              {(role === "admin" || role === "facturacion") && (
                <Link
                  href={`/drafts/${d.id}/finalize`}
                  className="px-3 py-1 rounded bg-green-600 text-white"
                >
                  Finalizar
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
