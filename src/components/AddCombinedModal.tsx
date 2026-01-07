// src/components/AddCombinedModal.tsx
"use client";
import { useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";

type SimpleItem = {
  code: string;
  description_en: string;
  form: string;
  size: string;
  pounds: number;
};

type Comb = { code: string; lbs: number };

export default function AddCombinedModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (items: SimpleItem[]) => void;
}) {
  const [rows, setRows] = useState<Comb[]>([{ code: "", lbs: 0 }]);

  if (!open) return null;

  async function resolveCombined() {
    const final: SimpleItem[] = [];

    for (const r of rows) {
      if (!r.code || !r.lbs) continue;

      try {
        const x = await fetchJSON(
          `/api/catalogs/species-by-code/${encodeURIComponent(
            r.code?.trim().toUpperCase()
          )}`
        );

        final.push({
          code: r.code.toUpperCase(),
          description_en: x.species.name_en,
          form: x.form.name,
          size: x.size.name,
          pounds: r.lbs,
        });
      } catch {
        alert(`Clave no encontrada: ${r.code}`);
        return;
      }
    }

    if (final.length === 0) return;

    onAdded(final);
    setRows([{ code: "", lbs: 0 }]);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-5 rounded-xl w-full max-w-xl">
        <h2 className="text-xl font-bold mb-3">Agregar caja combinada</h2>

        {rows.map((r, i) => (
          <div className="grid grid-cols-6 gap-3 mb-2" key={i}>
            <input
              className="col-span-4 border rounded px-2 py-1"
              placeholder="Clave especie"
              value={r.code}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((x, idx) =>
                    idx === i ? { ...x, code: e.target.value } : x
                  )
                )
              }
            />

            <input
              className="border rounded px-2 py-1"
              type="number"
              placeholder="Lbs"
              value={r.lbs}
              onChange={(e) =>
                setRows((prev) =>
                  prev.map((x, idx) =>
                    idx === i ? { ...x, lbs: Number(e.target.value) } : x
                  )
                )
              }
            />

            <button
              className="border rounded"
              onClick={() =>
                setRows((prev) => prev.filter((_, idx) => idx !== i))
              }
            >
              X
            </button>
          </div>
        ))}

        <button
          onClick={() => setRows([...rows, { code: "", lbs: 0 }])}
          className="px-3 py-1 border rounded mb-4"
        >
          + Línea
        </button>

        <div className="flex gap-3 mt-4">
          <button
            onClick={resolveCombined}
            className="px-3 py-1 bg-black text-white rounded"
          >
            Agregar caja
          </button>

          <button className="px-3 py-1 border rounded" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

