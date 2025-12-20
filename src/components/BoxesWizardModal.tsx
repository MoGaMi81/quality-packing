"use client";

import { useState } from "react";
import { usePackingStore } from "@/store/packingStore";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function BoxesWizardModal({ open, onClose }: Props) {
  if (!open) return null;

  const addLine = usePackingStore((s) => s.addLine);
  const lines = usePackingStore((s) => s.lines);

  /* ===== INPUTS MINIMOS ===== */
  const [code, setCode] = useState("");
  const [qty, setQty] = useState(1);
  const [pounds, setPounds] = useState(0);

  function nextBoxNo() {
    return lines.length > 0
      ? Math.max(...lines.map((l) => l.box_no)) + 1
      : 1;
  }

  function addBoxes() {
    if (!code.trim() || pounds <= 0 || qty <= 0) {
      alert("Clave y lbs son obligatorios.");
      return;
    }

    let boxNo = nextBoxNo();

    for (let i = 0; i < qty; i++) {
      addLine({
        box_no: boxNo++,
        code: code.trim().toUpperCase(),
        description_en: "",      // 🔹 viene de especie
        form: "",                // 🔹 viene de especie
        size: "",                // 🔹 viene de especie
        pounds,
        scientific_name: "",     // 🔹 viene de especie
      });
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-[520px] p-6">
        <h2 className="text-xl font-bold mb-4">Agregar cajas</h2>

        {/* ===== SIMPLE / RANGO ===== */}
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Clave especie"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border p-2 rounded col-span-2"
          />

          <input
            type="number"
            min={1}
            placeholder="Cantidad cajas"
            value={qty}
            onChange={(e) => setQty(+e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="number"
            min={0}
            placeholder="Lbs por caja"
            value={pounds}
            onChange={(e) => setPounds(+e.target.value)}
            className="border p-2 rounded"
          />
        </div>

        {/* ===== FOOTER ===== */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancelar
          </button>

          <button
            onClick={addBoxes}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
