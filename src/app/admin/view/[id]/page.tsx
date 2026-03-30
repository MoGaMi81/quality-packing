"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { secureFetch } from "@/lib/secureFetch";   // ✅ Importación cambiada
import { groupBoxesForView } from "@/domain/packing/view";
import type { ViewBox } from "@/domain/packing/view";
import { getRoleSafe } from "@/lib/session";

export default function ViewPacking() {
  const { id } = useParams();
  const router = useRouter();
  const [packing, setPacking] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!role) return;

    if (role !== "admin") {
      router.replace("/");
    }
  }, [role, router]);

  useEffect(() => {
    const r = getRoleSafe();
    console.log("ROLE VIEW:", r);
    setRole(r);
  }, []);

  useEffect(() => {
    secureFetch(`/api/packings/${id}`, {
      cache: "no-store",
      credentials: "include",
    })
      .then((r) => r.json())
      .then((res) => {
        if (!res?.ok) throw new Error();
        setPacking(res.packing);
      })
      .catch(() => router.replace("/admin/view"));
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

  // Cálculo de totalUSD con validación de rol
  const totalUSD =
    role === "admin" && packing.pricing_status === "DONE"
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

  if (!role) {
    return <div className="p-6">Cargando sesión...</div>;
  }

  if (role !== "admin") {
    return <div className="p-6">Redirigiendo...</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button onClick={() => router.back()} className="mb-4">
        ← Volver
      </button>

      {/* Render condicional dentro del return */}
      {role === "admin" && packing.pricing_status === "DONE" && (
        <div className="mb-4 text-green-600">
          Pricing completado y visible solo para admin
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold">
          Factura: {packing.invoice_no}
        </h1>
        {totalUSD != null && (
          <div className="text-right">
            <div className="text-sm text-gray-500">TOTAL USD</div>
            <div className="text-xl font-bold">
              {totalUSD.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
        )}
      </div>

      {/* HEADER */}
      <div className="border rounded p-4 mb-6 space-y-1">
        <div>
          <b>Cliente:</b>{" "}
          {packing.client_name ?? packing.client_code ?? "—"}
        </div>
        <div className="text-sm text-gray-500">
          {new Date(packing.created_at).toLocaleString()}
        </div>
        <div className="text-sm">
          <b>Status pricing:</b> {packing.pricing_status}
        </div>
      </div>

      {/* RESUMEN */}
      <div className="border rounded p-4 grid grid-cols-3 gap-4 text-base mb-6">
        <div>
          <b>Cajas:</b> {totalBoxes}
        </div>

        <div>
          <b>Total lbs:</b>{" "}
          {totalLbs.toLocaleString("en-US", {
            maximumFractionDigits: 0,
          })}
        </div>
      </div>

      {/* ✅ Botones SOLO ADMIN */}
      {role === "admin" && packing.pricing_status === "DONE" && (
        <div className="mt-6 flex justify-end gap-4">
          <a
            href={`/api/export/${id}/excel`}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Exportar Excel
          </a>

          <button
            onClick={() =>
              router.replace(
                `/facturacion/ver/${packing.invoice_no}?from=admin&returnId=${packing.id}`
              )
            }
            className="px-4 py-2 border rounded"
          >
            Ver Factura
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