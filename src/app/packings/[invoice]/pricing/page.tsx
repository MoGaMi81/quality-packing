"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";
import { getRole } from "@/lib/role";
import PricingSpeciesModal from "@/components/PricingSpeciesModal";
import type { PricingLine, SpeciesGroup } from "@/domain/packing/types";

function groupSpecies(lines: any) {
  const map = new Map();
  for (const l of lines) {
    const key = `${l.description_en}||${l.form}||${l.size}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        description_en: l.description_en,
        form: l.form,
        size: l.size,
        boxes: 1,
        pounds: l.pounds,
      });
    } else {
      const item = map.get(key);
      item.boxes++;
      item.pounds += l.pounds;
    }
  }
  return Array.from(map.values());
}

type PricingPageProps = {
  params: {
    invoice: string;
  };
};

export default function PricingPage({ params }: PricingPageProps) {
  const invoice = params.invoice;

  const role = getRole();

  const [packing, setPacking] = useState<any | null>(null);
  const [pricing, setPricing] = useState<PricingLine[]>([]);
  const [species, setSpecies] = useState<SpeciesGroup[]>([]);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (role !== "admin") {
      alert("Solo Administrador puede acceder a Pricing.");
      window.location.href = "/";
      return;
    }

    (async () => {
      const res = await fetchJSON(`/api/packings/pricing/${invoice}`);

      if (!res.packing) {
        alert("Packing no encontrado");
        return;
      }

      setPacking(res.packing);

      const sp = groupSpecies(res.packing.lines);
      setSpecies(sp);

      if (!res.pricing) {
        const initialPricing = res.packing.lines.map((l: { box_no: any; description_en: any; form: any; size: any; pounds: any; }) => ({
          box_no: l.box_no,
          description_en: l.description_en,
          form: l.form,
          size: l.size,
          pounds: l.pounds,
          price: 0,
          total: 0,
          key: `${l.description_en}||${l.form}||${l.size}`,
        }));
        setPricing(initialPricing);

        setShowModal(true);
      } else {
        setPricing(res.pricing.lines);
      }
    })();
  }, []);

  const applyPrices = (priceMap: { [x: string]: any; }) => {
    setPricing((prev) =>
      prev.map((l) => {
        const price = priceMap[l.key] ?? l.price ?? 0;
        return {
          ...l,
          price,
          total: l.pounds * price,
        };
      })
    );
  };

  const totalPounds = pricing.reduce((s, l) => s + l.pounds, 0);
  const subtotal = pricing.reduce((s, l) => s + l.total, 0);

  const savePricing = async () => {
    const payload = {
      invoice_no: invoice,
      pricing: {
        lines: pricing,
        air_freight: 0,
        total_pounds: totalPounds,
        subtotal,
        grand_total: subtotal,
      },
    };

    await fetchJSON(`/api/packings/pricing/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    alert("Pricing guardado.");
  };

  if (!packing) return <main className="p-6">Cargando…</main>;

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
            <th className="border p-2">Especie</th>
            <th className="border p-2">Form</th>
            <th className="border p-2">Size</th>
            <th className="border p-2">Lbs</th>
            <th className="border p-2">USD/lb</th>
            <th className="border p-2">Total USD</th>
          </tr>
        </thead>
        <tbody>
          {pricing.map((l) => (
            <tr key={l.box_no}>
              <td className="border p-2">{l.box_no}</td>
              <td className="border p-2">{l.description_en}</td>
              <td className="border p-2">{l.form}</td>
              <td className="border p-2">{l.size}</td>
              <td className="border p-2">{l.pounds}</td>
              <td className="border p-2">{l.price}</td>
              <td className="border p-2 text-right">{l.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right space-y-1">
        <div>Total Lbs: <b>{totalPounds.toFixed(2)}</b></div>
        <div>Subtotal USD: <b>{subtotal.toFixed(2)}</b></div>
        <div className="text-lg font-bold">Grand Total USD: {subtotal.toFixed(2)}</div>
      </div>

      <button
        className="px-4 py-2 bg-green-600 text-white rounded"
        onClick={savePricing}
      >
        Guardar Pricing
      </button>

      <PricingSpeciesModal
        open={showModal}
        species={species}
        onClose={() => setShowModal(false)}
        onSave={applyPrices}
      />
    </main>
  );
}
