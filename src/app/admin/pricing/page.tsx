"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Packing = {
  id: string;
  invoice_no: string;
  created_at: string;
  clients: {
    code: string;
    name: string;
  } | null;
};

export default function AdminHome() {
  const router = useRouter();
  const [packings, setPackings] = useState<Packing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/packings", {
          cache: "no-store",
        });
        const data = await res.json();
        setPackings(data.packings ?? []);
      } catch (e) {
        console.error("Error cargando packings", e);
        setPackings([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-6">Cargando…</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Pricing</h1>
      <p className="text-gray-600 mb-6">Packings pendientes de pricing</p>

      {packings.length === 0 && (
        <div className="text-gray-500">No hay packings pendientes</div>
      )}

      {packings.map((p) => (
        <div
          key={p.id}
          className="border rounded-xl p-4 mb-4 flex justify-between items-center"
        >
          <div>
            <div className="font-semibold text-lg">
              {p.invoice_no} · {p.clients?.name ?? "—"}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(p.created_at).toLocaleString()}
            </div>
            <div className="text-sm mt-1 text-gray-500">—</div>
          </div>
         <button
          onClick={() => router.push(`/admin/pricing/${p.id}`)}
          className="bg-green-700 text-white px-4 py-2 rounded"
        >
          Pricing
        </button>
        </div>
      ))}
    </div>
  );
}