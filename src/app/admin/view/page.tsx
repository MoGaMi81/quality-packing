"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { secureFetch } from "@/lib/secureFetch";

type Packing = {
  id: string;
  invoice_no: string;
  created_at: string;
  clients: { name: string } | null;
  status: string;
  pricing_status: string;
};

function getStatusBadge(status: string, pricing: string) {

  if (status === "READY" && pricing === "PENDING") {
    return {
      label: "SIN PRECIOS",
      color: "bg-yellow-200 text-yellow-800"
    };
  }

  if (status === "READY" && pricing === "DONE") {
    return {
      label: "CON PRECIOS",
      color: "bg-blue-200 text-blue-800"
    };
  }

  if (status === "COMPLETED") {
    return {
      label: "EXPORTADO",
      color: "bg-green-200 text-green-800"
    };
  }

  return {
    label: status,
    color: "bg-gray-200 text-gray-800"
  };
}

export default function AdminView() {
  const router = useRouter();
  const [latest, setLatest] = useState<Packing[]>([]);
  const [results, setResults] = useState<Packing[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    secureFetch("/api/admin/packings/latest", { 
      cache: "no-store",
      credentials: "include", })
      .then(r => r.json())
      .then(d => setLatest(d.packings ?? []));
  }, []);

  async function search() {
    if (!q.trim()) return setResults([]);
    const r = await secureFetch(`/api/admin/packings/search?q=${encodeURIComponent(q)}`);
    const d = await r.json();
    setResults(d.packings ?? []);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Ver Packings</h1>

      {/* Buscador */}
      <div className="flex gap-2 mb-8">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscar factura…"
          className="border rounded px-3 py-2 w-full"
        />
        <button
          onClick={search}
          className="bg-black text-white px-4 rounded"
        >
          Buscar
        </button>
      </div>

      {/* Últimos */}
      <h2 className="text-xl font-semibold mb-3">Últimos completos</h2>
      <ul className="mb-8 space-y-2">
        {latest.map(p => {
          const badge = getStatusBadge(p.status, p.pricing_status);

          return (
            <li
              key={p.id}
              className="cursor-pointer hover:underline flex items-center justify-between"
              onClick={() => router.push(`/admin/view/${p.id}`)}
            >
              <span>
  {p.invoice_no} · {p.clients?.name} ·{" "}
  {new Date(p.created_at).toLocaleDateString()}
</span>

<span
  className={`ml-3 px-2 py-1 rounded text-xs font-medium ${badge.color}`}
>
  {badge.label}
</span>
            </li>
          );
        })}
      </ul>

      {/* Resultados */}
      {results.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-3">Resultados</h2>
          <ul className="space-y-2">
            {results.map(p => {
              const badge = getStatusBadge(p.status, p.pricing_status);

              return (
                <li
                  key={p.id}
                  className="cursor-pointer hover:underline flex items-center justify-between"
                  onClick={() => router.push(`/admin/view/${p.id}`)}
                >
                  <span>
                    {p.invoice_no} · {p.clients?.name}
                  </span>

                  <span className={`px-2 py-1 text-xs rounded font-semibold ${badge.color}`}>
                    {badge.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}