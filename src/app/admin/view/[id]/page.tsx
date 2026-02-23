"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchJSON } from "@/lib/fetchJSON";
import { groupBoxesForView } from "@/domain/packing/view";
import type { ViewBox } from "@/domain/packing/view";

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
      .catch(() => router.push("/admin/view")); // ❌ ya no usamos replace
  }, [id, router]);

  if (!packing) return <div className="p-6">Cargando…</div>;

  /* =========================
     📊 TOTALES REALES
     ========================= */
  const boxes: ViewBox[] = groupBoxesForView(packing.packing_lines);

  const totalBoxes = boxes.length;

  const totalLbs = boxes.reduce(
    (s: number, b: ViewBox) => s + b.total_lbs,
    0
  );

  const totalUSD =
    packing.pricing_status === "DONE"
      ? boxes.reduce(
          (s: number, b: ViewBox) =>
            s +
            b.lines.reduce(
              (x: number, l: any) =>
                x + (l.pounds ?? 0) * (l.price ?? 0),
              0
            ),
          0
        )
      : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => router.back()} className="mb-4">
        ← Volver
      </button>

      <h1 className="text-2xl font-bold mb-4">
        Factura: {packing.invoice_no}
      </h1>

      {/* HEADER */}
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

      {/* RESUMEN */}
      <div className="border rounded p-4 grid grid-cols-3 gap-4 text-sm mb-6">
        <div>
          <b>Cajas:</b> {totalBoxes}
        </div>
        <div>
          <b>Total lbs:</b> {totalLbs.toFixed(2)}
        </div>
        {totalUSD != null && (
          <div>
            <b>Total USD:</b> ${totalUSD.toFixed(2)}
          </div>
        )}
      </div>

      {/* ✅ Botones extra cuando pricing está DONE */}
      {packing.pricing_status === "DONE" && (
        <div className="mt-6 flex justify-end gap-4">
          <a
            href={`/api/export/${id}/excel`}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Exportar Excel
          </a>

          <button
            onClick={() =>
            router.push(`/packings/${packing.id}/invoice`)
           }
            className="px-4 py-2 border rounded"
          >
            Ver Factura / Resumen
          </button>
        </div>
      )}

      {/* TABLA */}
      <div className="border rounded p-4">
        <h2 className="font-semibold mb-2">Líneas</h2>

        <table className="w-full border text-sm">
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
            {boxes.map((box: ViewBox, bi: number) =>
              box.lines.map((l: any, li: number) => (
                <tr key={`${bi}-${li}`}>
                  <td className="border p-2 text-center">
                    Caja #{box.box_no}
                    {box.isCombined ? " (Combinada)" : ""}
                  </td>

                  <td className="border p-2">{l.description_en}</td>
                  <td className="border p-2">{l.form}</td>
                  <td className="border p-2">{l.size}</td>

                  <td className="border p-2 text-right">
                    {l.pounds?.toFixed(2)}
                  </td>

                  <td className="border p-2 text-right">
                    {l.price != null ? `$${l.price.toFixed(2)}` : "—"}
                  </td>

                  <td className="border p-2 text-right">
                    {l.price != null
                      ? `$${(l.pounds * l.price).toFixed(2)}`
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