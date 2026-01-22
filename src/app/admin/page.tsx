"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Packing = {
  invoice_no: string;
  client_code: string;
  created_at: string;
  total_boxes: number;
  total_lbs: number;
};

export default function AdminHome() {
  const router = useRouter();
  const [packings, setPackings] = useState<Packing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/packings/ready-for-pricing");
      const data = await res.json();
      setPackings(data.packings ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="p-6">Cargando…</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Packings</h1>
      <p className="text-gray-600 mb-6">Listos para pricing</p>

      {packings.length === 0 && (
        <div className="text-gray-500">No hay packings pendientes</div>
      )}

      {packings.map((p) => (
        <div
          key={p.invoice_no}
          className="border rounded-xl p-4 mb-4 flex justify-between items-center"
        >
          <div>
            <div className="font-semibold text-lg">
              {p.invoice_no} · {p.client_code}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(p.created_at).toLocaleString()}
            </div>
            <div className="text-sm mt-1">
              {p.total_boxes} cajas · {p.total_lbs} lbs
            </div>
          </div>

          <button
            onClick={() =>
              router.push(`/packings/${p.invoice_no}/pricing`)
            }
            className="bg-green-700 text-white px-4 py-2 rounded"
          >
            Pricing
          </button>
        </div>
      ))}
    </div>
  );
}
