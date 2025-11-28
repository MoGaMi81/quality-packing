// src/components/AddRangeModal.tsx
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
  onAdded: (items: SimpleItem[]) => void;
};

export default function AddRangeModal({ open, onClose, onAdded }: Props) {
  const [key, setKey] = useState("");
  const [from, setFrom] = useState<number | "">("");
  const [to, setTo] = useState<number | "">("");
  const [lbs, setLbs] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const add = async () => {
    const code = key.trim().toUpperCase();
    const nFrom = typeof from === "string" ? NaN : from;
    const nTo = typeof to === "string" ? NaN : to;
    const nLbs = typeof lbs === "string" ? NaN : lbs;

    if (!code || !nFrom || !nTo || !nLbs || nTo < nFrom) return;

    setLoading(true);
    try {
      const r = await fetchJSON<any>(
        `/api/catalogs/species-by-code/${encodeURIComponent(code)}`
      );

      const base: SimpleItem = {
        description_en: r.species.name_en,
        form: r.form.name,
        size: r.size.name,
        pounds: nLbs,
      };

      const items: SimpleItem[] = [];
      for (let i = nFrom; i <= nTo; i++) items.push({ ...base });

      onAdded(items);
      setKey("");
      setFrom("");
      setTo("");
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
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-6">

        <h3 className="text-xl font-bold text-center">Agregar Rango</h3>

        <div className="space-y-2">
          <label className="font-semibold text-sm">Clave de especie</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <label className="font-semibold text-sm">Desde</label>
            <input
              type="number"
              className="border rounded px-3 py-2 w-full"
              value={from === "" ? "" : from}
              onChange={(e) =>
                setFrom(e.target.value === "" ? "" : parseInt(e.target.value))
              }
            />
          </div>

          <div className="flex-1 space-y-2">
            <label className="font-semibold text-sm">Hasta</label>
            <input
              type="number"
              className="border rounded px-3 py-2 w-full"
              value={to === "" ? "" : to}
              onChange={(e) =>
                setTo(e.target.value === "" ? "" : parseInt(e.target.value))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-semibold text-sm">Pounds por caja</label>
          <input
            type="number"
            className="border rounded px-3 py-2 w-full"
            value={lbs === "" ? "" : lbs}
            onChange={(e) =>
              setLbs(e.target.value === "" ? "" : parseInt(e.target.value))
            }
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
            disabled={loading}
          >
            Agregar
          </button>
        </div>

      </div>
    </div>
  );
}
