// src/components/PricingSpeciesModal.tsx
"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  speciesList: { key: string; label: string }[];
  onSave: (prices: Record<string, number>) => void;
};

export default function PricingSpeciesModal({
  open,
  onClose,
  speciesList,
  onSave,
}: Props) {
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;
    const init: Record<string, number> = {};
    speciesList.forEach((s) => (init[s.key] = 0));
    setPrices(init);
  }, [open, speciesList]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md space-y-4">

        <h2 className="text-xl font-bold">Prices per specie</h2>

        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {speciesList.map((s) => (
            <div key={s.key} className="flex items-center gap-2">
              <label className="w-48">{s.label}</label>
              <input
                type="number"
                className="border rounded px-2 py-1 w-24"
                value={prices[s.key] ?? 0}
                onChange={(e) =>
                  setPrices({ ...prices, [s.key]: Number(e.target.value) })
                }
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button className="px-3 py-1 border rounded" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-3 py-1 bg-black text-white rounded"
            onClick={() => onSave(prices)}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

