// src/components/AddBoxModal.tsx
"use client";

import { useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";

type SimpleItem = {
  description_en: string;
  form: string;
  size: string;
  pounds: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onAdded: (item: SimpleItem) => void;
};

export default function AddBoxModal({ open, onClose, onAdded }: Props) {
  const [key, setKey] = useState("");
  const [lbs, setLbs] = useState<string>("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const add = async () => {
    const code = key.trim().toUpperCase();
    const nLbs = Number(lbs);
    if (!code || !nLbs) return;

    setLoading(true);
    try {
      const r = await fetchJSON<any>(
        `/api/catalogs/species-by-code/${encodeURIComponent(code)}`
      );

      const item: SimpleItem = {
        description_en: r.species.name_en,
        form: r.form.name,
        size: r.size.name,
        pounds: nLbs,
      };

      onAdded(item);
      setKey("");
      setLbs("");
      onClose();
    } catch (e: any) {
      alert(e?.message || "Species not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-xl p-4 w-[420px] space-y-3">
        <h3 className="text-lg font-semibold">Agregar Caja</h3>

        <div className="space-y-1">
          <label className="text-sm">Especie</label>
          <input
            className="border rounded px-2 py-1 w-full"
            placeholder="e.g. BG5"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Pounds (int)</label>
          <input
            className="border rounded px-2 py-1 w-full"
            type="number"
            value={lbs}
            onChange={(e) => setLbs(e.target.value)}
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1 rounded border" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-3 py-1 rounded bg-black text-white disabled:opacity-50"
            onClick={add}
            disabled={loading || !key.trim() || !lbs}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
