"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchJSON } from "@/lib/fetchJSON";

export default function ViewPacking() {
  const { id } = useParams();
  const router = useRouter();
  const [packing, setPacking] = useState<any>(null);

  useEffect(() => {
    fetchJSON(`/api/packings/${id}`, { cache: "no-store" })
      .then((res) => {
        if (!res?.ok) throw new Error();
        setPacking(res.packing);
      })
      .catch(() => router.replace("/admin/view"));
  }, [id, router]);

  if (!packing) return <div className="p-6">Cargando…</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="mb-4">
        ← Volver
      </button>

      <h1 className="text-2xl font-bold mb-4">
        Factura: {packing.invoice_no}
      </h1>

      {/* HEADER INFO */}
      <div className="border rounded p-4 mb-6 space-y-1">
        <div>
          <b>Cliente:</b> {packing.clients?.name ?? "—"}
        </div>
        <div className="text-sm text-gray-500">
          {new Date(packing.created_at).toLocaleString()}
        </div>
        <div className="text-sm">
          <b>Status pricing:</b> {packing.pricing_status}
        </div>
      </div>

      {/* LÍNEAS */}
      <div className="border rounded p-4">
        <h2 className="font-semibold mb-2">Líneas</h2>

        {packing.packing_lines?.length === 0 && (
          <div className="text-gray-500">Sin líneas</div>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-1">Especie</th>
              <th>Forma</th>
              <th>Talla</th>
              <th>Lbs</th>
              <th>Precio</th>
            </tr>
          </thead>
          <tbody>
            {packing.packing_lines?.map((l: any, i: number) => (
              <tr key={i} className="border-b">
                <td>{l.description_en}</td>
                <td className="text-center">{l.form}</td>
                <td className="text-center">{l.size}</td>
                <td className="text-right">{l.pounds}</td>
                <td className="text-right">
                  {l.price != null ? `$${l.price}` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}