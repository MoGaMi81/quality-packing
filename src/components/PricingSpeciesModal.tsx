"use client";

import { useState } from "react";
import type { SpeciesGroup, PricingModalProps } from "@/domain/packing/types";

export default function PricingSpeciesModal({
  open,
  species,
  onClose,
  onSave,
}: PricingModalProps) {

  const [values, setValues] = useState<Record<string, number>>({});

  if (!open) return null;

  const update = (key: string, value: number) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const save = () => {
    onSave(values);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4">
        <h2 className="text-xl font-bold">Pricing por Especie</h2>

        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Especie</th>
              <th className="border p-2">Form</th>
              <th className="border p-2">Size</th>
              <th className="border p-2">USD/lb</th>
            </tr>
          </thead>

          <tbody>
            {species.map((s) => (
              <tr key={s.key}>
                <td className="border p-2">{s.description_en}</td>
                <td className="border p-2">{s.form}</td>
                <td className="border p-2">{s.size}</td>

                <td className="border p-2">
                  <input
                    type="number"
                    step="0.01"
                    className="border px-2 py-1 w-20"
                    onChange={(e) =>
                      update(s.key, Number(e.target.value))
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right">
          <button
            className="px-4 py-2 bg-black text-white rounded"
            onClick={save}
          >
            Aplicar precios
          </button>
        </div>
      </div>
    </div>
  );
}
