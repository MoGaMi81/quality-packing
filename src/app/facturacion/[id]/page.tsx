"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";
import { useRouter } from "next/navigation";

type Line = {
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

export default function FacturacionDetail({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const invoiceId = params.id;

  const [data, setData] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJSON<{ ok: boolean; invoice: Invoice }>(
      `/api/facturacion/by-invoice/${invoiceId}`
    )
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
  const totalAmount = data.lines.reduce(
    (s, l) => s + (l.amount ?? 0),
    0
  );

  return (
    <main className="p-6 space-y-6">
      <button
        onClick={() => router.back()}
        className="px-3 py-1 border rounded"
      >
        ← Volver
      </button>

      <h1 className="text-2xl font-bold">
        Factura {data.invoice_no}
      </h1>

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

      <div className="border rounded p-4 text-sm">
        <div>
          <b>Total lbs:</b>{" "}
          {totalNet.toLocaleString("en-US", {
            maximumFractionDigits: 0,
          })}
        </div>
        <div>
          <b>Total USD:</b>{" "}
          {totalAmount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
        </div>
      </div>
    </main>
  );
}