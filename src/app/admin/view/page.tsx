"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Packing = {
  id: string;
  invoice_no: string;
  created_at: string;
  clients: { name: string } | null;
};

export default function AdminView() {
  const router = useRouter();
  const [latest, setLatest] = useState<Packing[]>([]);
  const [results, setResults] = useState<Packing[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/admin/packings/latest", { cache: "no-store" })
      .then(r => r.json())
      .then(d => setLatest(d.packings ?? []));
  }, []);

  async function search() {
    if (!q.trim()) return setResults([]);
    const r = await fetch(`/api/admin/packings/search?q=${encodeURIComponent(q)}`);
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
      <ul className="mb-8">
        {latest.map(p => (
          <li
            key={p.id}
            className="cursor-pointer hover:underline"
            onClick={() => router.push(`/admin/view/${p.id}`)}
          >
            {p.invoice_no} · {p.clients?.name} ·{" "}
            {new Date(p.created_at).toLocaleDateString()}
          </li>
        ))}
      </ul>

      {/* Resultados */}
      {results.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-3">Resultados</h2>
          <ul>
            {results.map(p => (
              <li
                key={p.id}
                className="cursor-pointer hover:underline"
                onClick={() => router.push(`/admin/view/${p.id}`)}
              >
                {p.invoice_no} · {p.clients?.name}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
