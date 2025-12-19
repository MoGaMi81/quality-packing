"use client";

import { useState } from "react";
import { usePackingStore } from "@/store/packingStore";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Mode = "simple" | "range" | "combined";

export default function BoxesWizardModal({ open, onClose }: Props) {
  if (!open) return null;

  const addLine = usePackingStore((s) => s.addLine);
  const lines = usePackingStore((s) => s.lines);

  const [mode, setMode] = useState<Mode>("simple");

  /* ===== SIMPLE ===== */
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [form, setForm] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [pounds, setPounds] = useState(0);

  function addSimpleBoxes() {
    if (!code || qty <= 0 || pounds <= 0) {
      alert("Completa los datos obligatorios.");
      return;
    }

    const startBox =
      lines.length > 0
        ? Math.max(...lines.map((l) => l.box_no)) + 1
        : 1;

    for (let i = 0; i < qty; i++) {
      addLine({
        box_no: startBox + i,
        code,
        description_en: description,
        form,
        size,
        pounds,
        scientific_name: "",
      });
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center">
      <div
        className="bg-white rounded-xl w-[600px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">
          Agregar cajas
        </h2>

        {/* ===== TABS ===== */}
        <div className="flex gap-2 mb-6">
          <button
            className={`px-3 py-1 rounded ${
              mode === "simple"
                ? "bg-black text-white"
                : "border"
            }`}
            onClick={() => setMode("simple")}
          >
            Simple
          </button>

          <button
            disabled
            className="px-3 py-1 rounded border text-gray-400 cursor-not-allowed"
          >
            Rango
          </button>

          <button
            disabled
            className="px-3 py-1 rounded border text-gray-400 cursor-not-allowed"
          >
            Combinada
          </button>
        </div>

        {/* ===== SIMPLE UI ===== */}
        {mode === "simple" && (
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Clave especie"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="border p-2 rounded"
            />

            <input
              placeholder="Cantidad cajas"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(+e.target.value)}
              className="border p-2 rounded"
            />

            <input
              placeholder="Descripción EN"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border p-2 rounded col-span-2"
            />

            <input
              placeholder="Forma (W&G, Fillet)"
              value={form}
              onChange={(e) => setForm(e.target.value)}
              className="border p-2 rounded"
            />

            <input
              placeholder="Size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="border p-2 rounded"
            />

            <input
              placeholder="Lbs por caja"
              type="number"
              min={0}
              value={pounds}
              onChange={(e) => setPounds(+e.target.value)}
              className="border p-2 rounded col-span-2"
            />
          </div>
        )}

        {/* ===== FOOTER ===== */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancelar
          </button>

          {mode === "simple" && (
            <button
              onClick={addSimpleBoxes}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
