"use client";

import { useState } from "react";
import { usePackingStore } from "@/store/packingStore";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Mode = "simple" | "range" | "combined";

/* ===== RANGE ===== */
type RangeRow = {
  size: string;
  qty: number;
  pounds: number;
};

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

  /* ===== RANGE ===== */
  const [ranges, setRanges] = useState<RangeRow[]>([
    { size: "", qty: 1, pounds: 0 },
  ]);

  function nextBoxNo() {
    return lines.length > 0
      ? Math.max(...lines.map((l) => l.box_no)) + 1
      : 1;
  }

  /* ===== SIMPLE LOGIC ===== */
  function addSimpleBoxes() {
    if (!code || qty <= 0 || pounds <= 0) {
      alert("Completa los datos obligatorios.");
      return;
    }

    let boxNo = nextBoxNo();

    for (let i = 0; i < qty; i++) {
      addLine({
        box_no: boxNo++,
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

  /* ===== RANGE LOGIC ===== */
  function updateRange(
    index: number,
    field: keyof RangeRow,
    value: number | string
  ) {
    const copy = [...ranges];
    copy[index] = { ...copy[index], [field]: value };
    setRanges(copy);
  }

  function addRangeRow() {
    setRanges([...ranges, { size: "", qty: 1, pounds: 0 }]);
  }

  function addRangeBoxes() {
    if (!code || !form) {
      alert("Clave y forma son obligatorias.");
      return;
    }

    let boxNo = nextBoxNo();

    for (const r of ranges) {
      if (!r.size || r.qty <= 0 || r.pounds <= 0) continue;

      for (let i = 0; i < r.qty; i++) {
        addLine({
          box_no: boxNo++,
          code,
          description_en: description,
          form,
          size: r.size,
          pounds: r.pounds,
          scientific_name: "",
        });
      }
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-[600px] p-6">
        <h2 className="text-xl font-bold mb-4">Agregar cajas</h2>

        {/* ===== TABS ===== */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("simple")}
            className={`px-3 py-1 rounded ${
              mode === "simple" ? "bg-black text-white" : "border"
            }`}
          >
            Simple
          </button>

          <button
            onClick={() => setMode("range")}
            className={`px-3 py-1 rounded ${
              mode === "range" ? "bg-black text-white" : "border"
            }`}
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
              type="number"
              min={1}
              placeholder="Cantidad cajas"
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
              type="number"
              min={0}
              placeholder="Lbs por caja"
              value={pounds}
              onChange={(e) => setPounds(+e.target.value)}
              className="border p-2 rounded col-span-2"
            />
          </div>
        )}

        {/* ===== RANGE UI ===== */}
        {mode === "range" && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <input
                placeholder="Clave especie"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="border p-2 rounded"
              />

              <input
                placeholder="Forma (W&G, Fillet)"
                value={form}
                onChange={(e) => setForm(e.target.value)}
                className="border p-2 rounded"
              />

              <input
                placeholder="Descripción EN"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border p-2 rounded col-span-2"
              />
            </div>

            <div className="space-y-2">
              {ranges.map((r, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <input
                    placeholder="Size (1-2)"
                    value={r.size}
                    onChange={(e) =>
                      updateRange(i, "size", e.target.value)
                    }
                    className="border p-2 rounded"
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Cajas"
                    value={r.qty}
                    onChange={(e) =>
                      updateRange(i, "qty", +e.target.value)
                    }
                    className="border p-2 rounded"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Lbs"
                    value={r.pounds}
                    onChange={(e) =>
                      updateRange(i, "pounds", +e.target.value)
                    }
                    className="border p-2 rounded"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={addRangeRow}
              className="mt-3 text-sm underline"
            >
              + Agregar rango
            </button>
          </>
        )}

        {/* ===== FOOTER ===== */}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded">
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

          {mode === "range" && (
            <button
              onClick={addRangeBoxes}
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
