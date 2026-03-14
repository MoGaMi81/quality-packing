"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { fetchJSON } from "@/lib/fetchJSON";
import { getRole } from "@/lib/role";
import { calculateBoxStats } from "@/domain/packing/boxStats"; // ✅ nuevo import

type Line = {
  box_no: number;
  boxes: number | "MX";
  pounds: number;
  description: string;
  size: string;
  form: string;
  scientific_name: string | null;
  price: number | null;
  amount: number | null;
};

type Invoice = {
  raw_lines: any[];
  packing_id: string;
  invoice_no: string;
  client_code: string;
  client_name: string;
  guide: string | null;
  date: string;
  total_boxes: number;
  lines: Line[];
};

export default function VerFacturaPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(getRole());
  }, []);
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const { invoice } = useParams<{ invoice: string }>();
  const router = useRouter();
  const returnId = searchParams.get("returnId");

  const [data, setData] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJSON<{ ok: boolean; invoice: Invoice }>(
      `/api/facturacion/by-invoice/${invoice}`
    )
      .then((r) => {
        if (!r.ok) throw new Error("Factura no encontrada");
        setData(r.invoice);
      })
      .catch(() => alert("Error cargando factura"))
      .finally(() => setLoading(false));
  }, [invoice]);

  if (loading) return <main className="p-6">Cargando factura…</main>;
  if (!data) return null;

  /* =============================
     TOTALES
     ============================= */
  const totalNet = data.lines.reduce((s, l) => s + l.pounds, 0);
  const totalGross = totalNet * 1.31;
  const totalAmount = data.lines.reduce((s, l) => s + (l.amount ?? 0), 0);

  const { smallBoxes, largeBoxes, totalBoxes } = calculateBoxStats(data.raw_lines);

  const formatInt = (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const formatMoney = (n: number) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <main className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <button
          onClick={() => {
            if (from === "admin" && returnId) {
              router.replace(`/admin/view/${returnId}`);
            } else {
              router.replace("/facturacion");
            }
          }}
          className="px-3 py-1 border rounded"
        >
          ← Volver
        </button>

        <h1 className="text-2xl font-bold">Factura {data.invoice_no}</h1>

        <div className="text-right">
          <div className="text-sm text-gray-500">TOTAL USD</div>
          <div className="text-2xl font-bold">
            ${formatMoney(totalAmount)}
          </div>
        </div>
      </div>

      {/* INFO */}
      <div className="border rounded p-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <div><b>Cliente:</b> {data.client_name}</div>
          <div><b>Guía:</b> {data.guide || "-"}</div>
          <div><b>Fecha:</b> {new Date(data.date).toLocaleString()}</div>
        </div>

        <div>
          <div><b>NET WEIGHT:</b> {formatInt(totalNet)} lbs</div>
          <div><b>GROSS WEIGHT (+31%):</b> {formatInt(totalGross)} lbs</div>
        </div>

        {/* ✅ Mostrar cajas con calculateBoxStats */}
        <div>
          <div><b>Caja chica:</b> {smallBoxes}</div>
          <div><b>Caja grande:</b> {largeBoxes}</div>
          <div><b>Total cajas:</b> {totalBoxes}</div>
        </div>
      </div>

      {/* BOTONES SOLO ADMIN */}
      {role === "admin" && data?.packing_id && (
        <div className="flex justify-end gap-4 mt-4">
          <a
            href={`/api/export/${data.packing_id}/excel`}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Exportar Excel
          </a>

          <button
            onClick={async () => {
              if (!confirm("¿Reabrir pricing para editar precios?")) return;

              const res = await fetch(
                `/api/packings/${data.packing_id}/reopen-pricing`,
                { method: "PATCH" }
              );

              const json = await res.json();

              if (!json.ok) {
                alert(json.error || "Error reabriendo pricing");
                return;
              }

              router.replace(`/admin/pricing/${data.packing_id}`);
            }}
            className="px-4 py-2 border rounded"
          >
            Editar precios
          </button>

          <button
            onClick={async () => {
              if (!confirm("¿Reabrir este packing como Draft?")) return;

              const res = await fetch(
                `/api/packings/${data.packing_id}/reopen-draft`,
                { method: "PATCH" }
              );

              const json = await res.json();

              if (!json.ok) {
                alert(json.error);
                return;
              }

              router.replace(`/drafts/${json.draftId}`);
            }}
            className="px-4 py-2 border rounded text-red-600"
          >
            Reabrir como Draft
          </button>
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1 text-right">Boxes</th>
              <th className="border px-2 py-1 text-right">Pounds</th>
              <th className="border px-2 py-1">Description</th>
              <th className="border px-2 py-1">Size</th>
              <th className="border px-2 py-1">Form</th>
              <th className="border px-2 py-1">Scientific Name</th>
              <th className="border px-2 py-1 text-right">Price</th>
              <th className="border px-2 py-1 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((l, i) => (
              <tr key={i}>
                <td className="border px-2 py-1 text-right">{l.boxes}</td>
                <td className="border px-2 py-1 text-right">
                  {formatInt(l.pounds)}
                </td>
                <td className="border px-2 py-1">{l.description}</td>
                <td className="border px-2 py-1">{l.size}</td>
                <td className="border px-2 py-1">{l.form}</td>
                <td className="border px-2 py-1">{l.scientific_name}</td>

                <td className="border px-2 py-1 text-right">
                  {l.price != null ? l.price.toFixed(2) : "-"}
                </td>
                <td className="border px-2 py-1 text-right">
                  {l.amount != null ? formatMoney(l.amount) : "0.00"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="font-semibold bg-gray-50">
            <tr>
              <td className="border px-2 py-1 text-right">TOTAL</td>
              <td className="border px-2 py-1 text-right">
                {formatInt(totalNet)} lbs
              </td>
              <td colSpan={5} className="border" />
              <td className="border px-2 py-1 text-right">
                {formatMoney(totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </main>
  );
}