"use client";

import { useEffect, useMemo, useState } from "react";
import { useSpeciesCatalog } from "@/hooks/useSpeciesCatalog";
import { usePackingStore } from "@/store/packingStore";
import type { PackingLine } from "@/domain/packing/types";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SimpleRangeWizardModal({ open, onClose }: Props) {
  const { addLines } = usePackingStore();
  const { getByCode, loading } = useSpeciesCatalog();

  const [mode, setMode] = useState<"simple" | "range">("simple");
  const [code, setCode] = useState("");
  const [qty, setQty] = useState(1);
  const [pounds, setPounds] = useState(0);

  /* =====================
     Resolver catálogo REAL
  ===================== */
  const catalogItem = useMemo(() => {
    if (!code) return null;
    return getByCode(code);
  }, [code, getByCode]);

  /* =====================
     DEBUG (temporal)
  ===================== */
  useEffect(() => {
    console.log("SR | code:", code);
    console.log("SR | loading:", loading);
    console.log("SR | catalogItem:", catalogItem);
  }, [code, loading, catalogItem]);

  if (!open) return null;

  /* =====================
     Agregar líneas
  ===================== */
  function add() {
    if (!catalogItem || qty <= 0 || pounds <= 0) return;

    const lines: PackingLine[] = Array.from({ length: qty }).map((_, i) => ({
      box_no: 0, // se reasigna después en el packing
      code: catalogItem.code,
      description_en: catalogItem.description_en,
      form: catalogItem.form,
      size: catalogItem.size,
      pounds,
      is_combined: false,
    }));

    addLines(lines);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white w-[480px] rounded-lg p-4 shadow-lg">
        <h2 className="font-bold mb-4">
          Agregar Caja — Simple / Rango
        </h2>

        {/* Modo */}
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "simple"}
              onChange={() => setMode("simple")}
            />
            Simple
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "range"}
              onChange={() => setMode("range")}
            />
            Rango
          </label>
        </div>

        {/* Clave */}
        <input
          placeholder="Clave (ej. ARS1, YT1)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="border p-2 rounded w-full mb-1"
        />

        {code && !loading && !catalogItem && (
          <div className="text-red-600 text-sm mb-2">
            Clave no encontrada en catálogo
          </div>
        )}

        {/* Cantidad / Libras */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <input
            type="number"
            min={1}
            placeholder={mode === "simple" ? "Cajas" : "Cantidad (rango)"}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="border p-2 rounded"
          />

          <input
            type="number"
            min={1}
            placeholder="Lbs por caja"
            value={pounds}
            onChange={(e) => setPounds(Number(e.target.value))}
            className="border p-2 rounded"
          />
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="border px-4 py-2 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={add}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
