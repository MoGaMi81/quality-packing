"use client";

import { useEffect, useState } from "react";
import { secureFetch } from "@/lib/secureFetch";
import Link from "next/link";

type Line = {
  pricing_key: string;
  species: string;
  form: string;
  lbs: number;
  price: number;
  total: number;
};

export default function InvoicePage({
  params,
}: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastInvoice, setLastInvoice] = useState<string | null>(null);

  useEffect(() => {
    secureFetch(`/api/packings/${params.id}/invoice`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [params.id]);

  // 🔹 cargar última factura usada
  useEffect(() => {
    async function loadLastInvoice() {
      try {
        const res = await fetch("/api/packings/last-invoice", {
  cache: "no-store",
});
        const data = await res.json();
        setLastInvoice(data.invoice_no);
      } catch {
        setLastInvoice(null);
      }
    }
    loadLastInvoice();
  }, []);

  if (loading) return <p>Cargando factura…</p>;
  if (!data) return <p>No encontrado</p>;

  const { header, lines, totals } = data;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">

      <header>
        <h1 className="text-2xl font-bold">FACTURA</h1>

        <p><b>Cliente:</b> {header.client_name}</p>

        {/* 🔹 mostrar última factura usada */}
        {lastInvoice && (
          <div className="mb-2 text-sm text-gray-600">
            Última factura usada: <b>{lastInvoice}</b>
          </div>
        )}

        <p><b>Invoice:</b> {header.invoice}</p>
        <p><b>Fecha:</b> {header.date.slice(0, 10)}</p>

        {/* ✅ Cajas agregadas */}
        <p><b>Cajas chicas:</b> {totals.small_boxes}</p>
        <p><b>Cajas grandes:</b> {totals.large_boxes}</p>
        <p><b>Total cajas:</b> {totals.total_boxes}</p>
      </header>

      <div className="text-right space-y-1">
        <p><b>Total lbs:</b> {totals.total_lbs.toFixed(2)}</p>
        <p className="text-lg font-bold">
          Total USD: ${totals.total_usd.toFixed(2)}
        </p>
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Especie</th>
            <th className="border p-2">Forma</th>
            <th className="border p-2 text-right">Lbs</th>
            <th className="border p-2 text-right">Precio</th>
            <th className="border p-2 text-right">Total</th>
          </tr>
        </thead>

        <tbody>
          {lines.map((l: Line, i: number) => (
            <tr key={i}>
              <td className="border p-2">{l.species}</td>
              <td className="border p-2">{l.form}</td>
              <td className="border p-2 text-right">{l.lbs.toFixed(2)}</td>
              <td className="border p-2 text-right">${l.price.toFixed(2)}</td>
              <td className="border p-2 text-right">${l.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end gap-4">
        <a
          href={`/api/export/${params.id}/excel`}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Exportar Excel
        </a>
      </div>

      <div className="flex gap-4">
        <Link href="/admin" className="underline">
          Volver a Admin
        </Link>
      </div>
    </div>
  );
}