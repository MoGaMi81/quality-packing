// src/components/AddCombinedModal.tsx
"use client";

import { useState, useEffect } from "react";
import { fetchJSON } from "@/lib/fetchJSON";

type SimpleItem = {
  code: string
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
  initial?: SubLine[]; // opcional para editar cajas
};

export default function AddCombinedModal({ open, onClose, onAdded, initial }: Props) {
  const [subs, setSubs] = useState<SubLine[]>([{ key: "", lbs: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open]);

  // limpiar o cargar datos iniciales
  useEffect(() => {
    if (open) {
      setError("");
      setLoading(false);
      if (initial && initial.length > 0) {
        setSubs(initial);
      } else {
        setSubs([{ key: "", lbs: "" }]);
      }
    }
  }, [open, initial]);

  if (!open) return null;

  const update = (idx: number, field: keyof SubLine, value: any) => {
    setSubs((prev) =>
      prev.map((s, i) =>
        i === idx
          ? {
              ...s,
              [field]:
                field === "lbs"
                  ? value === "" ? "" : parseInt(value, 10)
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
    setError("");

    const valid = subs.filter(
      (s) => s.key.trim() !== "" && s.lbs !== "" && Number(s.lbs) > 0
    );

    if (valid.length === 0) {
      setError("Agrega al menos una línea válida.");
      return;
    }

    setLoading(true);

    try {
      const items: SimpleItem[] = [];

      for (const s of valid) {
        const code = s.key.trim().toUpperCase();
        const r = await fetchJSON<any>(
          `/api/catalogs/species-by-code/${encodeURIComponent(code)}`
        );

        items.push({
          code,
          description_en: r.species.name_en,
          form: r.form.name,
          size: r.size.name,
          pounds: Number(s.lbs),
        });
      }

      onAdded(items);
      onClose();
    } catch (e: any) {
      setError(e?.message || "Error al resolver alguna especie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      
      {/* Cerrar clic afuera */}
      <div className="absolute inset-0" onClick={() => !loading && onClose()} />

      <div className="relative bg-white rounded-xl p-6 w-[480px] shadow-xl animate-fade space-y-5">
        <h3 className="text-xl font-bold text-gray-800">
          Caja Combinada
        </h3>

        {/* Lista de SubLine */}
        <div className="space-y-4 max-h-[300px] overflow-auto pr-2">
          {subs.map((s, i) => (
            <div key={i} className="flex gap-3 items-end">

              {/* KEY */}
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium">Clave</label>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={s.key}
                  onChange={(e) => update(i, "key", e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* LBS */}
              <div className="w-32 space-y-1">
                <label className="text-sm font-medium">Libras</label>
                <input
                  type="number"
                  className="border rounded px-3 py-2 w-full"
                  value={s.lbs === "" ? "" : s.lbs}
                  onChange={(e) => update(i, "lbs", e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* REMOVE */}
              <button
                onClick={() => remove(i)}
                className="px-3 py-2 border rounded text-red-600"
                disabled={loading || subs.length === 1}
              >
                ✕
              </button>
            </div>
          ))}

          {/* Add line */}
          <button
            className="text-sm text-blue-600 underline"
            onClick={addRow}
            disabled={loading}
          >
            + Agregar línea
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            className="px-4 py-2 rounded border"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>

          <button
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            onClick={save}
            disabled={loading}
          >
            {loading ? "Procesando..." : "Guardar"}
          </button>
        </div>

      </div>
    </div>
  );
}

