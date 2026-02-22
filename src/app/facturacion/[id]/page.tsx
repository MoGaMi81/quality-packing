"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";
import { useRouter } from "next/navigation";

type Line = {
  line_id: string; // 👈 agregado
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
  invoice_no: string;
  client_code: string;
  client_name: string;
  guide: string | null;
  date: string;
  total_boxes: number;
  lines: Line[];
};

export default function FacturacionDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const invoiceId = params.id;

  const [data, setData] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJSON<{ ok: boolean; invoice: Invoice }>(
      `/api/packings/${invoiceId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Factura no encontrada");
        setData(r.invoice);
      })
      .catch(() => alert("Error cargando factura"))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (loading) return <main className="p-6">Cargando…</main>;
  if (!data) return null;

  const totalNet = data.lines.reduce((s, l) => s + l.pounds, 0);
  const totalAmount = data.lines.reduce((s, l) => s + (l.amount ?? 0), 0);

  return (
    <main className="p-6 space-y-6">
      <button onClick={() => router.back()} className="px-3 py-1 border rounded">
        ← Volver
      </button>

      <h1 className="text-2xl font-bold">Factura {data.invoice_no}</h1>

      <div className="border rounded p-4 space-y-1 text-sm">
        <div>
          <b>Cliente:</b> {data.client_name}
        </div>
        <div>
          <b>Guía:</b> {data.guide || "-"}
        </div>
        <div>
          <b>Fecha:</b> {new Date(data.date).toLocaleString()}
        </div>
        <div>
          <b>Total cajas:</b> {data.total_boxes}
        </div>
      </div>

      {/* ================== TABLA DE LÍNEAS ================== */}
      <table className="border-collapse border w-full text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Descripción</th>
            <th className="border px-2 py-1">Form</th>
            <th className="border px-2 py-1">Size</th>
            <th className="border px-2 py-1 text-right">Lbs</th>
            <th className="border px-2 py-1 text-right">Precio</th>
            <th className="border px-2 py-1 text-right">Monto</th>
          </tr>
        </thead>
        <tbody>
          {data.lines.map((l, i) => (
            <tr key={l.line_id}>
              <td className="border px-2 py-1">{l.description}</td>
              <td className="border px-2 py-1">{l.form}</td>
              <td className="border px-2 py-1">{l.size}</td>
              <td className="border px-2 py-1 text-right">{l.pounds}</td>

              {/* 👇 PRICE editable */}
              <td className="border px-2 py-1 text-right">
                <input
                  type="number"
                  step="0.01"
                  className="w-24 text-right border rounded px-1"
                  value={l.price ?? 0}
                  onChange={(e) => {
                    const newPrice = parseFloat(e.target.value) || 0;
                    const updated = [...data.lines];
                    updated[i].price = newPrice;
                    updated[i].amount = updated[i].pounds * newPrice;
                    setData({ ...data, lines: updated });
                  }}
                />
              </td>

              {/* 👇 AMOUNT calculado */}
              <td className="border px-2 py-1 text-right">
                {l.amount?.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ================== BOTÓN GUARDAR ================== */}
      <button
        className="mt-4 bg-black text-white px-4 py-2 rounded"
        onClick={async () => {
          const prices: Record<string, number> = {};

// Agrupar por description + form + size
for (const l of data.lines) {
  const key = `${l.description}|||${l.form}|||${l.size}`;
  prices[key] = l.price ?? 0;
}

await fetch(`/api/packings/${invoiceId}/pricing`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prices }),
});
          alert("Precios actualizados");
        }}
      >
        Guardar precios
      </button>

      <div className="border rounded p-4 text-sm">
        <div>
          <b>Total lbs:</b>{" "}
          {totalNet.toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </div>
        <div>
          <b>Total USD:</b>{" "}
          {totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
      </div>
    </main>
  );
}