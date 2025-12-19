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

  const [code, setCode] = useState("");
  const [qty, setQty] = useState(1);
  const [description, setDescription] = useState("");
  const [form, setForm] = useState("");
  const [size, setSize] = useState("");
  const [pounds, setPounds] = useState(0);
  const [scientific, setScientific] = useState("");

  function save() {
    if (!code || qty <= 0 || pounds <= 0) {
      alert("Completa los campos obligatorios.");
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
        scientific_name: scientific,
      });
    }

    // limpiar formulario
    setCode("");
    setQty(1);
    setDescription("");
    setForm("");
    setSize("");
    setPounds(0);
    setScientific("");

    onClose();
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center">
      <div
        className="bg-white rounded-lg w-[520px] p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-3">
          Agregar cajas
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Clave"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            placeholder="Cantidad cajas"
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="border p-2 rounded"
          />

          <input
            placeholder="Descripción EN"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 rounded col-span-2"
          />

          <input
            placeholder="Forma (W&G, Fillet...)"
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
            onChange={(e) => setPounds(Number(e.target.value))}
            className="border p-2 rounded"
          />

          <input
            placeholder="Scientific name"
            value={scientific}
            onChange={(e) => setScientific(e.target.value)}
            className="border p-2 rounded col-span-2"
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
