// src/components/AddRangeModal.tsx
"use client";

import { useState, useEffect } from "react";
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

  // limpiar al abrir
  useEffect(() => {
    if (open) {
      setKey("");
      setFrom("");
      setTo("");
      setLbs("");
      setLoading(false);
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const add = async () => {
    setError("");

    const code = key.trim().toUpperCase();
    const nFrom = typeof from === "string" ? NaN : from;
    const nTo = typeof to === "string" ? NaN : to;
    const nLbs = typeof lbs === "string" ? NaN : lbs;

    if (!code) return setError("Ingresa una clave de especie.");
    if (!nFrom || nFrom <= 0) return setError("Indica un número inicial válido.");
    if (!nTo || nTo <= 0) return setError("Indica un número final válido.");
    if (nTo < nFrom) return setError("El número final debe ser mayor o igual al inicial.");
    if (!nLbs || nLbs <= 0) return setError("Ingresa libras válidas.");

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

      <div className="relative bg-white rounded-xl p-6 w-[420px] shadow-xl animate-fade space-y-5">

        <h3 className="text-xl font-bold text-gray-800">Agregar Rango</h3>

        {/* Species */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Clave de especie</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Ej. BG5"
            disabled={loading}
          />
        </div>

        {/* Rango */}
        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Desde</label>
            <input
              type="number"
              className="border rounded px-3 py-2 w-full"
              value={from === "" ? "" : from}
              onChange={(e) =>
                setFrom(e.target.value === "" ? "" : parseInt(e.target.value, 10))
              }
              disabled={loading}
            />
          </div>

          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium">Hasta</label>
            <input
              type="number"
              className="border rounded px-3 py-2 w-full"
              value={to === "" ? "" : to}
              onChange={(e) =>
                setTo(e.target.value === "" ? "" : parseInt(e.target.value, 10))
              }
              disabled={loading}
            />
          </div>
        </div>

        {/* Lbs */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Libras por caja</label>
          <input
            type="number"
            className="border rounded px-3 py-2 w-full"
            value={lbs === "" ? "" : lbs}
            onChange={(e) =>
              setLbs(e.target.value === "" ? "" : parseInt(e.target.value, 10))
            }
            disabled={loading}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {/* Botones */}
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
            disabled={loading}
          >
            {loading ? "Procesando..." : "Agregar"}
          </button>
        </div>

      </div>
    </div>
  );
}

