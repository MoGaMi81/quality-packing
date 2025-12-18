// src/components/AddRangeModal.tsx
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

export default function AddRangeModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (items: SimpleItem[]) => void;
}) {
  const [code, setCode] = useState("");
  const [lbs, setLbs] = useState<number>(0);
  const [count, setCount] = useState<number>(1);

  if (!open) return null;

  async function resolveRange() {
    if (!code || !lbs || !count) return;

    try {
      const r = await fetchJSON(
        `/api/catalogs/species-by-code/${encodeURIComponent(
          code.trim().toUpperCase()
        )}`
      );

      const arr: SimpleItem[] = [];
      for (let i = 0; i < count; i++) {
        arr.push({
          code: code.toUpperCase(),
          description_en: r.species.name_en,
          form: r.form.name,
          size: r.size.name,
          pounds: lbs,
        });
      }

      onAdded(arr);

      setCode("");
      setLbs(0);
      setCount(1);
    } catch {
      alert("Especie no encontrada.");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-5 rounded-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-3">Agregar rango</h2>

        <label>Clave especie</label>
        <input
          className="border rounded px-2 py-1 w-full"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <label className="mt-3 block">Lbs por caja</label>
        <input
          type="number"
          className="border rounded px-2 py-1 w-full"
          value={lbs}
          onChange={(e) => setLbs(Number(e.target.value))}
        />

        <label className="mt-3 block">Cantidad de cajas</label>
        <input
          type="number"
          className="border rounded px-2 py-1 w-full"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={resolveRange}
            className="px-3 py-1 bg-black text-white rounded"
          >
            Agregar
          </button>
          <button className="px-3 py-1 border rounded" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}


