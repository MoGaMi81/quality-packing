"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";
import PricingModal from "@/components/PricingModal";
import { applyPricing } from "@/domain/packing/pricing";
import type { PackingLine } from "@/domain/packing/types";
import { getRole } from "@/lib/role";

export default function PricingPage({ params }: { params: { invoice: string } }) {
  const draftId = params.invoice.toUpperCase();
  const role = getRole();

  const [packing, setPacking] = useState<any | null>(null);
  const [priced, setPriced] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // -------------------------------------------------
  // CARGAR PACKING REAL
  // -------------------------------------------------
  useEffect(() => {
    if (role !== "admin") {
      alert("Solo el Administrador puede acceder a pricing.");
      window.location.href = "/";
      return;
    }

    (async () => {
      try {
        const res = await fetchJSON(`/api/packing-drafts/${draftId}`);

        if (!res.packing) {
          setErr("Packing no encontrado.");
        } else {
          // ✅ Ajuste: usar res.draft y res.lines
          setPacking(res.draft);
          setPriced(res.lines);
        }
      } catch (e: any) {
        setErr(e.message || "Error al cargar packing.");
      }
      setLoading(false);
    })();
  }, [draftId, role]);

  if (loading) return <main className="p-6">Cargando…</main>;
  if (err) return <main className="p-6 text-red-600">{err}</main>;
  if (!packing) return null;

  // ✅ Reemplazo correcto
  const lines: PackingLine[] = priced;

  // -------------------------------------------------
  // APLICAR PRECIOS DESDE EL MODAL
  // prices = { "desc|||size|||form" : 7.00 }
  // -------------------------------------------------
  const handleSavePrices = (prices: Record<string, number>) => {
    const applied = applyPricing(lines, prices);
    setPriced(applied);
  };

  const totalLbs = priced.reduce((s, x) => s + (x.pounds ?? 0), 0);
  const grandTotal = priced.reduce((s, x) => s + (x.total ?? 0), 0);

  // -------------------------------------------------
  // GUARDAR PRICING EN SUPABASE
  // -------------------------------------------------
  const saveToDb = async () => {
    try {
      const res = await fetch("/api/packing-drafts/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ Body correcto
        body: JSON.stringify({
          draft_id: draftId,
          lines: priced, // las líneas ya con precios aplicados
        }),
      });

      const json = await res.json();

      if (res.ok) {
        alert("Pricing guardado correctamente.");
      } else {
        alert(json.error || "Error al guardar.");
      }
    } catch (e: any) {
      alert(e.message || "Error al guardar pricing.");
    }
  };

  // Render helper para BOX / MX
  const renderBox = (l: any) => {
    if (l.combined_with && l.box_no !== l.combined_with) return "MX";
    return l.box_no;
  };

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-6">
      {/* BACK */}
      <a href={`/packings/${draftId}/view`} className="px-3 py-1 border rounded">
        ← Regresar
      </a>

      <h1 className="text-3xl font-bold">
        Pricing — Invoice {draftId}
      </h1>

      {/* Botones */}
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

      {/* TABLA */}
      <table className="w-full border mt-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Box</th>
            <th className="p-2 border">Item</th>
            <th className="p-2 border">Size</th>
            <th className="p-2 border">Lbs</th>
            <th className="p-2 border">USD/lb</th>
            <th className="p-2 border">Total</th>
          </tr>
        </thead>

        <tbody>
          {priced.map((l: any, i: number) => (
            <tr key={i}>
              <td className="p-2 border text-center">{renderBox(l)}</td>
              <td className="p-2 border">{l.description_en}</td>
              <td className="p-2 border text-center">{l.size}</td>
              <td className="p-2 border text-right">{l.pounds}</td>
              <td className="p-2 border text-right">{l.price?.toFixed(2)}</td>
              <td className="p-2 border text-right">{l.total?.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right text-lg font-bold mt-4">
        Total LBS: {totalLbs}
        <br />
        Subtotal: ${grandTotal.toFixed(2)}
      </div>

      {openModal && (
        <PricingModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          lines={lines}
          onSave={handleSavePrices}
        />
      )}
    </main>
  );
}