"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";
import { getRole } from "@/lib/role";

type PricingLine = {
  box_no: number;
  pounds: number;
  price: number;
  total: number;
};

export default function PricingPage({ params }: { params: { invoice: string } }) {
  const invoice = params.invoice;
  const role = getRole(); // "admin" | "proceso" | "facturacion"

  const [packing, setPacking] = useState<any | null>(null);
  const [pricing, setPricing] = useState<PricingLine[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "admin") {
      alert("Solo Administrador puede acceder a Pricing.");
      window.location.href = "/";
      return;
    }

    (async () => {
      try {
        const res = await fetchJSON(`/api/packings/pricing/${invoice}`);

        if (!res.packing) {
          setErr("Packing no encontrado.");
          return;
        }

        setPacking(res.packing);

        // Mapear las líneas de packing a líneas con precio
        const pricedLines = res.packing.lines.map((l: any) => {
          const existing = res.pricing?.lines?.find((x: any) => x.box_no === l.box_no);
          const price = existing?.price ?? 0;

          return {
            box_no: l.box_no,
            pounds: l.pounds,
            price,
            total: l.pounds * price,
          };
        });

        setPricing(pricedLines);
      } catch (e: any) {
        setErr(e.message ?? "Error al cargar pricing.");
      }
    })();
  }, [invoice, role]);

  if (err) return <main className="p-6 text-red-600">{err}</main>;
  if (!packing) return <main className="p-6">Cargando…</main>;

  const totalPounds = pricing.reduce((s, l) => s + l.pounds, 0);
  const subtotal = pricing.reduce((s, l) => s + l.total, 0);

  const updateLine = (box_no: number, price: number) => {
    setPricing((old) =>
      old.map((l) =>
        l.box_no === box_no
          ? { ...l, price, total: price * l.pounds }
          : l
      )
    );
  };

  const savePricing = async () => {
    const payload = {
      invoice_no: invoice,
      pricing: {
        lines: pricing,
        air_freight: 0,
        total_pounds: totalPounds,
        subtotal,
        grand_total: subtotal, // luego sumamos aire
      },
    };

    const res = await fetchJSON(`/api/packings/pricing/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) alert("Error al guardar");
    else alert("Pricing guardado");
  };

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      
      <a href={`/packings/${invoice}/view`} className="px-3 py-1 border rounded">
        ← Regresar
      </a>

      <h1 className="text-3xl font-bold">Pricing — Invoice {invoice}</h1>

      <div className="text-sm text-gray-600 space-y-1">
        <div>Cliente: <b>{packing.header.client_name}</b></div>
        <div>Fecha: {packing.header.date}</div>
        <div>AWB: {packing.header.guide}</div>
      </div>

      <table className="min-w-full border mt-6">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Box</th>
            <th className="border p-2">Lbs</th>
            <th className="border p-2">Price USD/lb</th>
            <th className="border p-2">Total USD</th>
          </tr>
        </thead>
        <tbody>
          {pricing.map((l) => (
            <tr key={l.box_no}>
              <td className="border p-2">{l.box_no}</td>
              <td className="border p-2">{l.pounds}</td>
              <td className="border p-2">
                <input
                  type="number"
                  step="0.01"
                  className="border px-2 py-1 w-24"
                  value={l.price}
                  onChange={(e) => updateLine(l.box_no, Number(e.target.value))}
                />
              </td>
              <td className="border p-2 text-right">
                {l.total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right space-y-1">
        <div>Total Lbs: <b>{totalPounds.toFixed(2)}</b></div>
        <div>Subtotal USD: <b>{subtotal.toFixed(2)}</b></div>
        <div className="text-lg font-bold">
          Grand Total USD: {subtotal.toFixed(2)}
        </div>
      </div>

      <button
        className="px-4 py-2 bg-green-600 text-white rounded"
        onClick={savePricing}
      >
        Guardar Pricing
      </button>
    </main>
  );
}
