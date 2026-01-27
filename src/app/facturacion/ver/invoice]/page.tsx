"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchJSON } from "@/lib/fetchJSON";

type Line = {
  boxes: number | "MX";
  pounds: number;
  description: string;
  size: string;
  form: string;
  scientific_name: string | null;
  price: number;
  amount: number;
};

type Invoice = {
  invoice_no: string;
  client_code: string;
  guide: string | null;
  date: string;
  lines: Line[];
};

export default function VerFacturaPage() {
  const { invoice } = useParams<{ invoice: string }>();
  const router = useRouter();

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
      .catch((e) => alert(e.message))
      .finally(() => setLoading(false));
  }, [invoice]);

  if (loading) return <main className="p-6">Cargando factura…</main>;
  if (!data) return null;

  const totalPounds = data.lines.reduce((s, l) => s + l.pounds, 0);
  const totalAmount = data.lines.reduce((s, l) => s + l.amount, 0);

  return (
    <main className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => router.replace("/facturacion")}
          className="px-3 py-1 border rounded"
        >
          ← Volver
        </button>

        <h1 className="text-2xl font-bold">Factura {data.invoice_no}</h1>

        <div />
      </div>

      {/* INFO */}
      <div className="border rounded p-4 grid grid-cols-2 gap-2 text-sm">
        <div><b>Cliente:</b> {data.client_code}</div>
        <div><b>Guía:</b> {data.guide || "-"}</div>
        <div><b>Fecha:</b> {new Date(data.date).toLocaleString()}</div>
      </div>

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
                <td className="border px-2 py-1 text-right">{l.pounds.toFixed(2)}</td>
                <td className="border px-2 py-1">{l.description}</td>
                <td className="border px-2 py-1">{l.size}</td>
                <td className="border px-2 py-1">{l.form}</td>
                <td className="border px-2 py-1">{l.scientific_name}</td>
                <td className="border px-2 py-1 text-right">{l.price.toFixed(2)}</td>
                <td className="border px-2 py-1 text-right">{l.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="font-semibold bg-gray-50">
            <tr>
              <td className="border px-2 py-1 text-right">Total</td>
              <td className="border px-2 py-1 text-right">{totalPounds.toFixed(2)}</td>
              <td colSpan={5} className="border" />
              <td className="border px-2 py-1 text-right">{totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </main>
  );
}
