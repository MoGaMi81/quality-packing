"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Role = "admin" | "proceso" | "facturacion";

type Draft = {
  id: string;
  client_code: string;
  internal_ref: string;
  status: string;
  created_at: string;
};

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  const role: Role = "admin"; // ← AQUÍ está la clave
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/packing-drafts/list", {
          cache: "no-store",
        });
        const data = await r.json();

        if (data.ok) {
          setDrafts(data.drafts || []);
        } else {
          console.error(data.error);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="p-6">Cargando borradores...</p>;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="px-3 py-1 border rounded"
        >
          ← Inicio
        </button>

        <h1 className="text-3xl font-bold">Drafts</h1>

        <Link
          href="/drafts/new"
          className="px-4 py-2 bg-blue-600 text-white rounded"
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
              <div className="text-lg font-semibold">
                {d.client_code} · {d.internal_ref}
              </div>

              <div className="text-sm text-gray-500">
                Estado: {d.status} ·{" "}
                {new Date(d.created_at).toLocaleString()}
              </div>
            </div>

            <div className="flex gap-2">
              {(role === "admin" || role === "proceso") && (
                <Link
                  href={`/drafts/${d.id}`}
                  className="px-3 py-1 rounded border"
                >
                  Editar
                </Link>
              )}

              {role === "admin" && (
                <Link
                  href={`/api/export/draft?id=${d.id}`}
                  className="px-3 py-1 rounded bg-gray-800 text-white"
                >
                  Exportar
                </Link>
              )}

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
