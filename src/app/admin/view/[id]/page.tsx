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

  /* =====================================================
     📦 AGRUPAR LÍNEAS POR CAJA (RESPETA COMBINADAS)
     ===================================================== */
  const boxes: Record<number, any[]> = packing.packing_lines.reduce(
    (acc: Record<number, any[]>, line: any) => {
      const boxNo = line.box_no ?? 0;
      acc[boxNo] ||= [];
      acc[boxNo].push(line);
      return acc;
    },
    {}
  );

  const boxNumbers = Object.keys(boxes)
    .map(Number)
    .sort((a, b) => a - b);

  /* =====================================================
     📊 TOTALES REALES
     ===================================================== */
  const totalBoxes = boxNumbers.length;

  const totalLbs = packing.packing_lines.reduce(
    (sum: number, l: any) => sum + (l.pounds ?? 0),
    0
  );

  const totalAmount =
    packing.pricing_status === "DONE"
      ? packing.packing_lines.reduce(
          (sum: number, l: any) =>
            sum + (l.pounds ?? 0) * (l.price ?? 0),
          0
        )
      : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="mb-4">
        ← Volver
      </button>

      <h1 className="text-2xl font-bold mb-4">
        Factura: {packing.invoice_no}
      </h1>

      {/* ================= HEADER ================= */}
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

      {/* ================= RESUMEN ================= */}
      <div className="border rounded p-4 grid grid-cols-3 gap-4 text-sm mb-6">
        <div>
          <b>Cajas:</b> {totalBoxes}
        </div>
        <div>
          <b>Total lbs:</b> {totalLbs.toFixed(2)}
        </div>
        {totalAmount != null && (
          <div>
            <b>Total USD:</b> ${totalAmount.toFixed(2)}
          </div>
        )}
      </div>

      {/* ================= TABLA ================= */}
      <div className="border rounded p-4">
        <h2 className="font-semibold mb-2">Líneas</h2>

        {packing.packing_lines.length === 0 && (
          <div className="text-gray-500">Sin líneas</div>
        )}

        <table className="w-full border mt-4 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Caja</th>
              <th className="p-2 border">Especie</th>
              <th className="p-2 border">Forma</th>
              <th className="p-2 border">Size</th>
              <th className="p-2 border text-right">Lbs</th>
              <th className="p-2 border text-right">Precio</th>
              <th className="p-2 border text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {boxNumbers.map((boxNo) =>
              boxes[boxNo].map((l: any, i: number) => (
                <tr key={`${boxNo}-${i}`}>
                  <td className="border p-2 text-center">
                    Caja #{boxNo}
                    {boxes[boxNo].length > 1 && " (Combinada)"}
                  </td>
                  <td className="border p-2">{l.description_en}</td>
                  <td className="border p-2">{l.form}</td>
                  <td className="border p-2">{l.size}</td>
                  <td className="border p-2 text-right">
                    {l.pounds?.toFixed(2)}
                  </td>
                  <td className="border p-2 text-right">
                    {l.price ? `$${l.price.toFixed(2)}` : "—"}
                  </td>
                  <td className="border p-2 text-right">
                    {l.price
                      ? `$${((l.pounds ?? 0) * l.price).toFixed(2)}`
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
