// src/components/AddCombinedModal.tsx
"use client";

import { useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";

type SimpleItem = {
  description_en: string;
  form: string;
  size: string;
  pounds: number;
};

type SubLine = { key: string; lbs: number | "" };

type Props = {
  open: boolean;
  onClose: () => void;
  onAdded: (items: SimpleItem[]) => void;
};

export default function AddCombinedModal({ open, onClose, onAdded }: Props) {
  const [subs, setSubs] = useState<SubLine[]>([{ key: "", lbs: "" }]);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const update = (idx: number, field: keyof SubLine, value: any) => {
    setSubs((prev) =>
      prev.map((s, i) =>
        i === idx
          ? {
              ...s,
              [field]:
                field === "lbs"
                  ? value === ""
                    ? ""
                    : parseInt(value, 10)
                  : value,
            }
          : s
      )
    );
  };

  const remove = (idx: number) => {
    setSubs((prev) => prev.filter((_, i) => i !== idx));
  };

  const addRow = () => {
    setSubs((prev) => [...prev, { key: "", lbs: "" }]);
  };

  const save = async () => {
    // Filtrar líneas vacías
    const valid = subs.filter(
      (s) => s.key.trim() !== "" && s.lbs !== "" && Number(s.lbs) > 0
    );
    if (valid.length === 0) return;

    setLoading(true);
    try {
      const items: SimpleItem[] = [];

      for (const s of valid) {
        const code = s.key.trim().toUpperCase();
        const lbsNum = Number(s.lbs);
        const r = await fetchJSON<any>(
          `/api/catalogs/species-by-code/${encodeURIComponent(code)}`
        );
        items.push({
          description_en: r.species.name_en,
          form: r.form.name,
          size: r.size.name,
          pounds: lbsNum,
        });
      }

      onAdded(items);
      setSubs([{ key: "", lbs: "" }]);
      onClose();
    } catch (e: any) {
      alert(e?.message || "Error resolving species code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-xl p-4 w-[460px] space-y-3">
        <h3 className="text-lg font-semibold">Add combined box</h3>

        <div className="space-y-2">
          {subs.map((s, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                <label>Key</label>
                <input
                  className="border rounded px-2 py-1 w-full"
                  value={s.key}
                  onChange={(e) => update(i, "key", e.target.value)}
                />
              </div>
              <div className="w-28">
                <label>Lbs</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-full"
                  value={s.lbs === "" ? "" : s.lbs}
                  onChange={(e) => update(i, "lbs", e.target.value)}
                />
              </div>
              <button
                onClick={() => remove(i)}
                className="border rounded px-2 h-8"
              >
                ✕
              </button>
            </div>
          ))}
          <button className="text-sm underline" onClick={addRow}>
            + Add line
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 border rounded" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-3 py-1 bg-black text-white rounded"
            onClick={save}
            disabled={loading}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
