"use client";

import { useEffect, useState } from "react";
import { usePackingStore } from "@/store/packingStore";
import type { PackingLine } from "@/domain/packing/types";

/* ===============================
   TIPOS DE CATALOGO (MINIMO)
   luego lo conectamos a Supabase
================================ */

type SpeciesCatalogItem = {
  code: string;
  description_en: string;
  form: string;
  size: string;
};

/* ===============================
   PROPS
================================ */

type Props = {
  open: boolean;
  onClose: () => void;
};

/* ===============================
   MOCK CATALOGO (TEMPORAL)
   👉 luego se reemplaza por fetch
================================ */

const MOCK_CATALOG: SpeciesCatalogItem[] = [
  {
    code: "BG5",
    description_en: "BLACK GROUPER FRESH",
    form: "W&G",
    size: "5-10",
  },
  {
    code: "BL3",
    description_en: "BLACK SNAPPER FRESH",
    form: "W&G",
    size: "3-4",
  },
];

/* ===============================
   COMPONENT
================================ */

export default function SimpleRangeWizardModal({
  open,
  onClose,
}: Props) {
  const { lines, addLines } = usePackingStore();

  const [mode, setMode] = useState<"simple" | "range">("simple");

  const [code, setCode] = useState("");
  const [catalogItem, setCatalogItem] =
    useState<SpeciesCatalogItem | null>(null);

  const [qty, setQty] = useState<number>(1);
  const [pounds, setPounds] = useState<number>(0);

  /* ===============================
     Buscar especie en catálogo
  ================================ */

  useEffect(() => {
    if (!code) {
      setCatalogItem(null);
      return;
    }

    const found = MOCK_CATALOG.find(
      (s) => s.code.toUpperCase() === code.toUpperCase()
    );

    setCatalogItem(found ?? null);
  }, [code]);

  if (!open) return null;

  /* ===============================
     Crear cajas
  ================================ */

  function save() {
    if (!catalogItem) {
      alert("Clave no encontrada en catálogo");
      return;
    }

    if (qty <= 0 || pounds <= 0) {
      alert("Cantidad y lbs deben ser mayores a 0");
      return;
    }

    const lastBoxNo =
      lines.length > 0
        ? Math.max(
            ...lines
              .filter((l) => typeof l.box_no === "number")
              .map((l) => l.box_no as number)
          )
        : 0;

    const newLines: PackingLine[] = Array.from(
      { length: qty },
      (_, i) => ({
        box_no: lastBoxNo + i + 1,
        code: catalogItem.code,
        description_en: catalogItem.description_en,
        form: catalogItem.form,
        size: catalogItem.size,
        pounds,
      })
    );

    addLines(newLines);
    onClose();
  }

  /* ===============================
     UI
  ================================ */

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white w-[520px] rounded-xl p-5 shadow-lg">
        <h2 className="text-lg font-bold mb-4">
          Agregar Caja — Simple / Rango
        </h2>

        {/* MODE */}
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={mode === "simple"}
              onChange={() => setMode("simple")}
            />
            Simple
          </label>

          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={mode === "range"}
              onChange={() => setMode("range")}
            />
            Rango
          </label>
        </div>

        {/* CLAVE */}
        <input
          placeholder="Clave (ej. BG5)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="border p-2 rounded w-full mb-2"
        />

        {/* INFO CATALOGO */}
        {catalogItem && (
          <div className="bg-gray-100 p-2 rounded text-sm mb-3">
            <div>
              <b>{catalogItem.description_en}</b>
            </div>
            <div>
              {catalogItem.form} — {catalogItem.size}
            </div>
          </div>
        )}

        {!catalogItem && code && (
          <div className="text-red-600 text-sm mb-3">
            Clave no encontrada
          </div>
        )}

        {/* QTY */}
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          placeholder="Cantidad de cajas"
          className="border p-2 rounded w-full mb-2"
        />

        {/* LBS */}
        <input
          type="number"
          min={1}
          value={pounds}
          onChange={(e) => setPounds(Number(e.target.value))}
          placeholder="Lbs por caja"
          className="border p-2 rounded w-full mb-4"
        />

        {/* ACTIONS */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
