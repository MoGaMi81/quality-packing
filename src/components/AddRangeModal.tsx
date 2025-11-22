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
      for (let i = nFrom; i <= nTo; i++) {
        items.push({ ...base });
      }

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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-xl p-4 w-[420px] space-y-3">
        <h3 className="text-lg font-semibold">Add range</h3>

        <div className="space-y-1">
          <label>Species key</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label>From</label>
            <input
              type="number"
              className="border rounded px-2 py-1 w-full"
              value={from === "" ? "" : from}
              onChange={(e) =>
                setFrom(e.target.value === "" ? "" : parseInt(e.target.value, 10))
              }
            />
          </div>
          <div className="flex-1">
            <label>To</label>
            <input
              type="number"
              className="border rounded px-2 py-1 w-full"
              value={to === "" ? "" : to}
              onChange={(e) =>
                setTo(e.target.value === "" ? "" : parseInt(e.target.value, 10))
              }
            />
          </div>
        </div>

        <div>
          <label>Pounds per box</label>
          <input
            type="number"
            className="border rounded px-2 py-1 w-full"
            value={lbs === "" ? "" : lbs}
            onChange={(e) =>
              setLbs(e.target.value === "" ? "" : parseInt(e.target.value, 10))
            }
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button className="px-3 py-1 rounded border" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-3 py-1 rounded bg-black text-white"
            onClick={add}
            disabled={loading}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
