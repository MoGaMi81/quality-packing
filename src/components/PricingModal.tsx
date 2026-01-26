"use client";

import { useEffect, useState } from "react";
import type { PackingLine } from "@/domain/packing/types";

/**
 * Genera la clave EXACTA por línea
 * (misma lógica que el backend espera)
 */
function priceKey(l: PackingLine) {
  // EXCEPCIÓN: GROUPERS → un solo precio
  if (
    l.description_en === "BLACK GROUPER FRESH" ||
    l.description_en === "GAG GROUPER FRESH" ||
    l.description_en === "FIRE BACK GROUPER FRESH" ||
    l.description_en === "SCAMP GROUPER FRESH"
  ) {
    return l.description_en;
  }

  return `${l.description_en}|||${l.size}|||${l.form}`;
}

type PriceReq = {
  key: string;
  display: string;
};

type Props = {
  open: boolean;
  lines: PackingLine[];
  onClose: () => void;
  onSave: (prices: Record<string, number>) => void;
};

export default function PricingModal({
  open,
  lines,
  onClose,
  onSave,
}: Props) {
  const [reqs, setReqs] = useState<PriceReq[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    // 1️⃣ Construir requerimientos ÚNICOS
    const map = new Map<string, PriceReq>();

    for (const l of lines) {
      const key = priceKey(l);
      if (!map.has(key)) {
        map.set(key, {
          key,
          display:
            key.indexOf("|||") === -1
              ? key
              : `${l.description_en} ${l.form} ${l.size}`,
        });
      }
    }

    const r = Array.from(map.values());
    setReqs(r);

    // 2️⃣ Inicializar valores
    const init: Record<string, string> = {};
    r.forEach((x) => (init[x.key] = ""));
    setValues(init);

    setError("");
  }, [open, lines]);

  if (!open) return null;

  const save = () => {
    const out: Record<string, number> = {};

    for (const req of reqs) {
      const raw = values[req.key];
      const n = Number(raw);

      if (!Number.isFinite(n) || n <= 0) {
        setError(`Falta precio válido para ${req.display}`);
        return;
      }

      out[req.key] = n;
    }

    onSave(out);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-xl font-bold">Precios</h2>

        {reqs.map((req) => (
          <div key={req.key} className="space-y-1">
            <label className="text-sm font-semibold block">
              {req.display}
            </label>
            <input
              className="border rounded px-3 py-1 w-full"
              value={values[req.key] ?? ""}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  [req.key]: e.target.value,
                }))
              }
              placeholder="Precio USD"
              type="number"
              min="0"
              step="0.01"
            />
          </div>
        ))}

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex justify-end gap-3 pt-4">
          <button className="px-3 py-1 border rounded" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="px-4 py-1 bg-black text-white rounded"
            onClick={save}
          >
            Guardar precios
          </button>
        </div>
      </div>
    </div>
  );
}
