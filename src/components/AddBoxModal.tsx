// src/components/AddBoxModal.tsx
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

type Props = {
  open: boolean;
  onClose: () => void;
  onAdded: (item: SimpleItem) => void;
};

export default function AddBoxModal({ open, onClose, onAdded }: Props) {
  const [key, setKey] = useState("");
  const [lbs, setLbs] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  // cuando se abre, limpiar
  useEffect(() => {
    if (open) {
      setKey("");
      setLbs("");
      setError("");
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const add = async () => {
    setError("");

    const code = key.trim().toUpperCase();
    const nLbs = Number(lbs);

    if (!code) {
      setError("Ingresa una clave de especie.");
      return;
    }
    if (!nLbs || nLbs <= 0) {
      setError("Ingresa libras válidas.");
      return;
    }

    setLoading(true);

    try {
      const r = await fetchJSON<any>(
        `/api/catalogs/species-by-code/${encodeURIComponent(code)}`
      );

      const item: SimpleItem = {
        code,
        description_en: r.species.name_en,
        form: r.form.name,
        size: r.size.name,
        pounds: nLbs,
      };

      onAdded(item);
      onClose();
    } catch (e: any) {
      setError(e?.message || "Especie no encontrada.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      {/* fondo clicable */}
      <div
        className="absolute inset-0"
        onClick={() => !loading && onClose()}
      />

      <div className="relative bg-white rounded-xl p-6 w-[420px] shadow-xl animate-fade space-y-4">
        <h3 className="text-xl font-bold text-gray-800">Agregar Caja</h3>

        <div className="space-y-1">
          <label className="text-sm font-medium">Clave de especie</label>
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Ej. BG5"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Libras</label>
          <input
            className="border rounded px-3 py-2 w-full"
            type="number"
            value={lbs}
            onChange={(e) => setLbs(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

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
            onClick={add}
            disabled={loading || !key.trim() || !lbs}
          >
            {loading ? "Procesando..." : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}
