"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";
import { getRole } from "@/lib/role";

export default function PricingPage({ params }: { params: { invoice: string } }) {
  const invoice = params.invoice;
  const role = getRole();   // "proceso", "facturacion", "admin"

  const [data, setData] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "admin") {
      alert("Solo Administrador puede ver precios.");
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
        setErr(e.message);
      }
    })();
  }, [invoice, role]);

  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!data) return <div className="p-6">Cargando...</div>;

  return (
    <main className="p-6 space-y-4">
      <a href={`/packing/${invoice}/view`} className="px-3 py-1 border rounded">
        ← Volver
      </a>

      <h1 className="text-3xl font-bold">Pricing — Invoice {invoice}</h1>

      <p className="text-sm text-gray-600">
        (pantalla en construcción – aquí colocaremos los precios por especie y exportación)
      </p>

      <pre className="bg-gray-100 p-4 rounded">
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}
