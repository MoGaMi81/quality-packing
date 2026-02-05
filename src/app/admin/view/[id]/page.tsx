"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchJSON } from "@/lib/fetchJSON";

type PackingLine = {
  description_en: string;
  form: string;
  size: string;
  pounds: number;
  price?: number;
  box_no: number;
  box_type: "SIMPLE" | "RANGE" | "COMBINED";
};

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

  const lines: PackingLine[] = packing.packing_lines ?? [];

  /* ================= AGRUPAR POR CAJA ================= */
  const boxes = useMemo(() => {
    const map = new Map<number, PackingLine[]>();
    for (const l of lines) {
      if (!map.has(l.box_no)) map.set(l.box_no, []);
      map.get(l.box_no)!.push(l);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [lines]);

  /* ================= TOTALES ================= */
  const totalBoxes = boxes.length;

  const totalLbs = lines.reduce(
    (sum, l) => sum + (l.pounds ?? 0),
    0
  );

  const totalAmount =
    packing.pricing_status === "DONE"
      ? lines.reduce(
          (sum, l) => sum + (l.pounds ?? 0) * (l.price ?? 0),
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
        {totalAmount != null && (
          <div>
            <b>Total USD:</b> ${totalAmount.toFixed(2)}
          </div>
        )}
      </div>

      {/* CAJAS */}
      <div className="space-y-6">
        {boxes.map(([boxNo, boxLines]) => {
          const isCombined = boxLines[0].box_type === "COMBINED";
          const boxTotal = boxLines.reduce(
            (s, l) => s + (l.pounds ?? 0),
            0
          );

          return (
            <div key={boxNo} className="border rounded p-4">
              <h3 className="font-semibold mb-2">
                Caja #{boxNo}
                {isCombined && " (Combinada)"}
              </h3>

              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Especie</th>
                    <th className="p-2 border">Forma</th>
                    <th className="p-2 border">Size</th>
                    <th className="p-2 border text-right">Lbs</th>
                    <th className="p-2 border text-right">Precio</th>
                    <th className="p-2 border text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {boxLines.map((l, i) => (
                    <tr key={i}>
                      <td className="border p-2">{l.description_en}</td>
                      <td className="border p-2">{l.form}</td>
                      <td className="border p-2">{l.size}</td>
                      <td className="border p-2 text-right">
                        {l.pounds.toFixed(2)}
                      </td>
                      <td className="border p-2 text-right">
                        {l.price ? `$${l.price.toFixed(2)}` : "—"}
                      </td>
                      <td className="border p-2 text-right">
                        {l.price
                          ? `$${(l.pounds * l.price).toFixed(2)}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-right mt-2 text-sm font-semibold">
                Total caja: {boxTotal.toFixed(2)} lbs
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
