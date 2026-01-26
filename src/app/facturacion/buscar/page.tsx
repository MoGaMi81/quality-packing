"use client";

import { useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";

export default function BuscarFacturaPage() {
  const [invoice, setInvoice] = useState("");
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState("");

  async function buscar() {
    setError("");
    setData(null);

    if (!invoice.trim()) return;

    const res = await fetchJSON(
      `/api/facturacion/by-invoice/${invoice.trim()}`
    );

    if (!res.ok) {
      setError(res.error || "No encontrada");
      return;
    }

    setData(res.invoice);
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <button
        onClick={() => history.back()}
        className="px-3 py-1 border rounded"
      >
        ← Volver
      </button>

      <h1 className="text-2xl font-bold">Buscar factura</h1>

      <div className="flex gap-3">
        <input
          value={invoice}
          onChange={(e) => setInvoice(e.target.value)}
          placeholder="Número de factura"
          className="border px-3 py-2 rounded w-64"
        />
        <button
          onClick={buscar}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Buscar
        </button>
      </div>

      {error && <div className="text-red-600">{error}</div>}

      {data && (
        <div className="border rounded p-4 space-y-4">
          <div>
            <b>Factura:</b> {data.invoice_no} <br />
            <b>Cliente:</b> {data.client_code} <br />
            <b>Guía:</b> {data.guide}
          </div>

          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th>Cajas</th>
                <th>Lbs</th>
                <th>Descripción</th>
                <th>Talla</th>
                <th>Forma</th>
                <th>Precio</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((l: any, i: number) => (
                <tr key={i} className="border-t">
                  <td>{l.boxes}</td>
                  <td>{l.pounds.toFixed(2)}</td>
                  <td>{l.description}</td>
                  <td>{l.size}</td>
                  <td>{l.form}</td>
                  <td>{l.price}</td>
                  <td>{l.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
