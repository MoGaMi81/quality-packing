"use client";

import { useEffect, useState } from "react";
import type { PackingLine } from "@/domain/packing/types";
import { extractPricingSpecies } from "@/domain/packing/pricing";

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

    // 🔥 USAR SOLO EL ENGINE CENTRAL
    const r = extractPricingSpecies(lines).map((req) => ({
      key: req.key,
      display: req.display,
    }));

    setReqs(r);

    // 🔹 inicializar valores (si ya hay precios)
    const init: Record<string, string> = {};

    for (const req of r) {
      const exampleLine = lines.find((l) => {
        const key =
          req.key === "GROUPER_WG"
            ? (
                l.form === "W&G" &&
                !l.description_en?.toUpperCase().includes("FILLET") &&
                [
                  "BLACK GROUPER FRESH",
                  "SCAMP GROUPER FRESH",
                  "FIRE BACK GROUPER FRESH",
                  "GAG GROUPER FRESH",
                ].some((name) =>
                  (l.description_en ?? "").toUpperCase().startsWith(name)
                )
              )
            : `${l.description_en}|||${l.form}|||${l.size}` === req.key;

        return key;
      });

      if (exampleLine?.price != null) {
        init[req.key] = exampleLine.price.toString();
      } else {
        init[req.key] = "";
      }
    }

    setValues(init);
    setError("");
  }, [open, lines]);

  if (!open) return null;

  const save = () => {
    const out: Record<string, number> = {};

    for (const req of reqs) {
      const n = Number(values[req.key]);

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
      <div className="bg-white rounded p-6 max-h-[85vh] overflow-y-auto w-[420px]">
        <h2 className="text-xl font-bold mb-4">Precios</h2>

        {reqs.map((req) => (
          <div key={req.key} className="space-y-1 mb-3">
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

        {error && (
          <div className="text-red-600 text-sm mb-2">{error}</div>
        )}

        <div className="flex justify-end gap-3 pt-2">
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