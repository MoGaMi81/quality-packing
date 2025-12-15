"use client";

import { useEffect, useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";
import PricingSpeciesModal from "@/components/PricingSpeciesModal";
import { loadSpeciesBundle, findSpeciesCode } from "@/lib/speciesCatalog";
import { getFamilyKeyFromCode } from "@/domain/packing/families";

export default function PricingPage({ params }: { params: { invoice: string } }) {
  const invoice = params.invoice;

  const [packing, setPacking] = useState<any | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [speciesList, setSpeciesList] = useState<{ key: string; label: string }[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});

  // Cargar species bundle y packing
  useEffect(() => {
    (async () => {
      await loadSpeciesBundle();

      const r = await fetchJSON(`/api/packings/by-invoice/${invoice}`);
      if (!r.packing) {
        alert("Packing not found");
        return;
      }
      setPacking(r.packing);
      setRows(r.packing.lines);
    })();
  }, [invoice]);

  // Detectar especies únicas
  const prepareSpeciesList = () => {
    const set = new Map<string, string>();

    rows.forEach((l) => {
      const code = findSpeciesCode(l);
      const fam = getFamilyKeyFromCode(code);

      if (fam) {
        // BLACK GROUPER only once
        set.set("BLACK GROUPER", "BLACK GROUPER");
      } else {
        const key = `${l.description_en}|||${l.size}`;
        const label = `${l.description_en} ${l.size}`;
        set.set(key, label);
      }
    });

    const list = [...set.entries()].map(([key, label]) => ({ key, label }));
    setSpeciesList(list);
    setModalOpen(true);
  };

  const applyPrices = (prices: Record<string, number>) => {
    const newRows = rows.map((l) => {
      const code = findSpeciesCode(l);
      const fam = getFamilyKeyFromCode(code);

      let key: string;
      if (fam) key = fam; // BLACK GROUPER
      else key = `${l.description_en}|||${l.size}`;

      return {
        ...l,
        price: prices[key] ?? 0,
        total: l.pounds * (prices[key] ?? 0),
      };
    });

    setRows(newRows);
    setPrices(prices);
  };

  const totalLbs = rows.reduce((s, r) => s + (r.pounds || 0), 0);
  const subtotal = rows.reduce((s, r) => s + (r.total || 0), 0);

  if (!packing) return <main className="p-6">Loading…</main>;

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">

      <a href={`/packings/${invoice}/view`} className="px-3 py-1 border rounded">
        ← Back
      </a>

      <h1 className="text-3xl font-bold">Pricing — Invoice {invoice}</h1>

      <button
        className="px-4 py-2 bg-black text-white rounded"
        onClick={prepareSpeciesList}
      >
        Enter Prices
      </button>

      <PricingSpeciesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        speciesList={speciesList}
        onSave={(p) => {
          setModalOpen(false);
          applyPrices(p);
        }}
      />

      <table className="min-w-full border mt-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Box</th>
            <th className="border p-2">Item</th>
            <th className="border p-2">Size</th>
            <th className="border p-2">Lbs</th>
            <th className="border p-2">USD/lb</th>
            <th className="border p-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="border p-2">{r.box_no}</td>
              <td className="border p-2">{r.description_en}</td>
              <td className="border p-2">{r.size}</td>
              <td className="border p-2 text-right">{r.pounds}</td>
              <td className="border p-2 text-right">{r.price ?? 0}</td>
              <td className="border p-2 text-right">{(r.total ?? 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right text-lg font-bold">
        Total Lbs: {totalLbs} <br />
        Subtotal: ${subtotal.toFixed(2)}
      </div>
    </main>
  );
}

