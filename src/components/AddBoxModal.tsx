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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-5">

        <h3 className="text-xl font-bold text-center">Agregar Caja Simple</h3>

        <div className="space-y-2">
          <label className="font-semibold text-sm">Clave de especie</label>
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Ej: BG5"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="font-semibold text-sm">Pounds</label>
          <input
            className="border rounded px-3 py-2 w-full"
            type="number"
            value={lbs}
            onChange={(e) => setLbs(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            className="px-4 py-2 rounded border hover:bg-gray-100"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            onClick={add}
            disabled={loading || !key.trim() || !lbs}
          >
            Agregar
          </button>
        </div>

      </div>
    </div>
  );
}
