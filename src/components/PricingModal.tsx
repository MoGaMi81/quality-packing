// ===============================================
//  PricingModal.tsx
//  Ventana para capturar precios POR LÍNEA
// ===============================================

"use client";

import { useEffect, useState } from "react";
import { extractPricingSpecies, PricingRequest } from "@/domain/packing/pricing";
import type { PackingLine } from "@/domain/packing/types";

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
  const [reqs, setReqs] = useState<PricingRequest[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  /* ================= INIT ================= */
  useEffect(() => {
    if (!open) return;

    const r = extractPricingSpecies(lines);
    setReqs(r);

    const init: Record<string, string> = {};
    r.forEach((x) => {
      init[x.key] = "";
    });
    setValues(init);

    setError("");
  }, [open, lines]);

  if (!open) return null;

  /* ================= SAVE ================= */
  const save = () => {
    const out: Record<string, number> = {};

    for (const req of reqs) {
      const raw = values[req.key];

      // 👇 FIX CRÍTICO
      // "" → NaN (no 0)
      const n = raw === "" ? NaN : Number(raw);

      if (Number.isNaN(n) || n <= 0) {
        setError(`Falta precio válido para ${req.display}`);
        return;
      }

      out[req.key] = n;
    }

    onSave(out);
    onClose();
  };

  /* ================= UI ================= */
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
              value={values[req.key]}
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
          <button
            className="px-3 py-1 border rounded"
            onClick={onClose}
          >
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
