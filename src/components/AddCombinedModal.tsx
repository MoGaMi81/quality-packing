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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-6">

        <h3 className="text-xl font-bold text-center">Caja Combinada</h3>

        <div className="space-y-4">
          {subs.map((s, i) => (
            <div key={i} className="flex gap-3 items-end">

              <div className="flex-1 space-y-1">
                <label className="font-semibold text-sm">Clave</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={s.key}
                  onChange={(e) => update(i, "key", e.target.value)}
                />
              </div>

              <div className="w-32 space-y-1">
                <label className="font-semibold text-sm">Lbs</label>
                <input
                  type="number"
                  className="border rounded px-3 py-2 w-full"
                  value={s.lbs === "" ? "" : s.lbs}
                  onChange={(e) => update(i, "lbs", e.target.value)}
                />
              </div>

              <button
                onClick={() => remove(i)}
                className="border rounded px-2 py-2 h-[40px] hover:bg-gray-100"
              >
                ✕
              </button>

            </div>
          ))}

          <button
            className="text-sm underline text-blue-600 hover:text-blue-800"
            onClick={addRow}
          >
            + Agregar línea
          </button>
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
            onClick={save}
            disabled={loading}
          >
            Guardar
          </button>
        </div>

      </div>
    </div>
  );
}
