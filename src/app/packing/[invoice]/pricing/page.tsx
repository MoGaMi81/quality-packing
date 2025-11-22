"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";
import { getRole } from "@/lib/role";

export default function PricingPage({ params }: { params: { invoice: string } }) {
  const invoice = params.invoice;
  const role = getRole(); // "admin" | "proceso" | "facturacion"

  const [data, setData] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  
  // verificamos rol y cargamos la información
  useEffect(() => {
    if (role !== "admin") {
      alert("Solo el Administrador puede acceder a pricing.");
      window.location.href = "/";
      return;
    }

    (async () => {
      try {
        const res = await fetchJSON(`/api/packing/by-invoice/${invoice}`);
        if (!res.packing) {
          setErr("Packing no encontrado.");
        } else {
          setData(res.packing);
        }
      } catch (e: any) {
        setErr(e.message ?? "Error al cargar packing.");
      }
    })();
  }, [invoice, role]);

  if (err) return <main className="p-6 text-red-600">{err}</main>;
  if (!data) return <main className="p-6">Cargando…</main>;

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <a href={`/packing/${invoice}/view`} className="px-3 py-1 border rounded">
        ← Regresar
      </a>

      <h1 className="text-3xl font-bold">Pricing — Invoice {invoice}</h1>

      <div className="text-sm text-gray-600">
        Cliente: <b>{data.header.client_name}</b><br />
        Fecha: {data.header.date}<br />
        AWB: {data.header.guide}
      </div>

      <p className="text-sm italic text-gray-500">
        (Pantalla base — lista para agregar precios, totales y exportación)
      </p>

      <table className="min-w-full border mt-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Box</th>
            <th className="border p-2">Item</th>
            <th className="border p-2">Form</th>
            <th className="border p-2">Size</th>
            <th className="border p-2">Lbs</th>
          </tr>
        </thead>
        <tbody>
          {data.lines.map((l: any, i: number) => (
            <tr key={i}>
              <td className="border p-2">{l.box_no}</td>
              <td className="border p-2">{l.description_en}</td>
              <td className="border p-2">{l.form}</td>
              <td className="border p-2">{l.size}</td>
              <td className="border p-2 text-right">{l.pounds}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
