"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";
import PricingModal from "@/components/PricingModal";
import { applyPricing } from "@/domain/packing/pricing";
import type { PackingLine } from "@/domain/packing/types";
import { getRole } from "@/lib/role";

export default function PricingPage({ params }: { params: { invoice: string } }) {
  const invoice = params.invoice.toUpperCase();
  const role = getRole(); // admin / proceso / facturación

  const [packing, setPacking] = useState<any | null>(null);
  const [priced, setPriced] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // --------------------------
  // CARGAR PACKING REAL
  // --------------------------
  useEffect(() => {
    if (role !== "admin") {
      alert("Solo el Administrador puede acceder a pricing.");
      window.location.href = "/";
      return;
    }

    (async () => {
      try {
        const res = await fetchJSON(`/api/packings/by-invoice/${invoice}`);
        if (!res.packing) {
          setErr("Packing no encontrado.");
        } else {
          setPacking(res.packing);
          setPriced(res.packing.lines); // mostrar sin precios al inicio
        }
      } catch (e: any) {
        setErr(e.message || "Error al cargar packing.");
      }
      setLoading(false);
    })();
  }, [invoice, role]);

  if (loading) return <main className="p-6">Cargando…</main>;
  if (err) return <main className="p-6 text-red-600">{err}</main>;
  if (!packing) return null;

  const lines: PackingLine[] = packing.lines;

  // --------------------------
  // MANEJO DE PRECIOS
  // --------------------------
  const handleSavePrices = (prices: Record<string, number>) => {
    const applied = applyPricing(lines, prices);
    setPriced(applied);
  };

  const totalLbs = priced.reduce((s, x) => s + (x.pounds ?? 0), 0);
  const grandTotal = priced.reduce((s, x) => s + (x.total ?? 0), 0);

  // --------------------------
  // GUARDAR EN SUPABASE
  // --------------------------
  const saveToDb = async () => {
    try {
      const res = await fetchJSON(`/api/packings/pricing/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_no: invoice,
          pricing: priced,
        }),
      });

      if (res.ok) {
        alert("Pricing guardado correctamente.");
      } else {
        alert(res.error || "Error al guardar.");
      }
    } catch (e: any) {
      alert(e.message || "Error al guardar pricing.");
    }
  };

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      {/* BACK */}
      <a href={`/packings/${invoice}/view`} className="px-3 py-1 border rounded">
        ← Regresar
      </a>

      {/* TITULO */}
      <h1 className="text-3xl font-bold">Pricing — Invoice {invoice}</h1>

      <div className="text-sm text-gray-600">
        Cliente: <b>{packing.header.client_name}</b><br />
        Fecha: {packing.header.date}<br />
        AWB: {packing.header.guide}
      </div>

      {/* BOTONES */}
      <div className="flex gap-4">
        <button
          className="px-4 py-2 bg-black text-white rounded"
          onClick={() => setOpenModal(true)}
        >
          Capturar precios
        </button>

        <button
          className="px-4 py-2 bg-green-700 text-white rounded"
          onClick={saveToDb}
        >
          Guardar Pricing
        </button>
      </div>

      {/* TABLA DE PRICING */}
      <section className="overflow-x-auto">
        <table className="min-w-full border mt-4 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Box</th>
              <th className="border p-2">Item</th>
              <th className="border p-2">Form</th>
              <th className="border p-2">Size</th>
              <th className="border p-2 text-right">Lbs</th>
              <th className="border p-2 text-right">Price</th>
              <th className="border p-2 text-right">Total</th>
            </tr>
          </thead>

          <tbody>
            {priced.map((l, i) => {
              const showBox =
                typeof l.box_no === "number"
                  ? l.box_no
                  : "MX"; // soporte para combinadas

              return (
                <tr key={i}>
                  <td className="border p-2">{showBox}</td>
                  <td className="border p-2">{l.description_en}</td>
                  <td className="border p-2">{l.form}</td>
                  <td className="border p-2">{l.size}</td>
                  <td className="border p-2 text-right">{l.pounds}</td>
                  <td className="border p-2 text-right">
                    {l.price ? l.price.toFixed(2) : ""}
                  </td>
                  <td className="border p-2 text-right">
                    {l.total ? l.total.toFixed(2) : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="font-semibold bg-gray-100">
              <td className="border p-2" colSpan={4}>
                TOTAL LBS
              </td>
              <td className="border p-2 text-right">{totalLbs}</td>
              <td className="border p-2"></td>
              <td className="border p-2 text-right">
                {grandTotal.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* MODAL */}
      <PricingModal
        open={openModal}
        lines={lines}
        onClose={() => setOpenModal(false)}
        onSave={handleSavePrices}
      />
    </main>
  );
}


