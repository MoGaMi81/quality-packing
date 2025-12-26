"use client";
import { sanitizeLine } from "@/lib/sanitizePackingLine";
import { useEffect, useState } from "react";
import { usePackingStore } from "@/store/packingStore";
import type { PackingLine } from "@/domain/packing/types";

type Props = {
  open: boolean;
  onClose: () => void;
  boxNo?: number | null;
};

export default function BoxesWizardModal({
  open,
  onClose,
  boxNo,
}: Props) {
  const { lines, setLines, addLines } = usePackingStore();

  const [localLines, setLocalLines] = useState<PackingLine[]>([]);
  const [code, setCode] = useState("");
  const [pounds, setPounds] = useState<number>(0);
  const [qty, setQty] = useState<number>(1);

  /* =====================
     Cargar caja existente
  ===================== */
  useEffect(() => {
    if (!open) return;

    if (boxNo != null) {
      setLocalLines(
        lines.filter((l) => Number(l.box_no) === boxNo)
      );
    } else {
      setLocalLines([]);
    }

    setCode("");
    setPounds(0);
    setQty(1);
  }, [open, boxNo, lines]);

  if (!open) return null;

  /* =====================
     Agregar línea
  ===================== */
  function addLine() {
    if (!code || pounds <= 0 || qty <= 0) return;

    const nextBoxNo =
      boxNo ??
      (lines.length > 0
        ? Math.max(...lines.map((l) => Number(l.box_no))) + 1
        : 1);

    const newLines: PackingLine[] = Array.from({ length: qty }).map(
      () => ({
        box_no: nextBoxNo,
        code,
        pounds,
        description_en: "",
        form: "",
        size: "",
        scientific_name: "",
      })
    );

    setLocalLines((prev) => [...prev, ...newLines]);
    setCode("");
    setPounds(0);
    setQty(1);
  }

  /* =====================
     Guardar caja
  ===================== */
  function save() {
  if (localLines.length === 0) return;

  const sanitized: PackingLine[] = localLines.map((l) =>
  sanitizeLine(l)
);
  if (boxNo != null) {
    const others = lines.filter(
      (l) => Number(l.box_no) !== boxNo
    );
    setLines([...others, ...sanitized]);
  } else {
    addLines(sanitized);
  }

  onClose();
}

  /* =====================
     Eliminar caja
  ===================== */
  function removeBox() {
    if (boxNo == null) return;

    setLines(
      lines.filter((l) => Number(l.box_no) !== boxNo)
    );
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-[520px] rounded p-4 shadow-lg">
        <h2 className="font-bold mb-3">
          {boxNo != null
            ? `Editar Caja #${boxNo}`
            : "Agregar Caja"}
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Clave"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            placeholder="Cantidad"
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="border p-2 rounded"
          />

          <input
            placeholder="Lbs por línea"
            type="number"
            min={1}
            value={pounds}
            onChange={(e) => setPounds(Number(e.target.value))}
            className="border p-2 rounded col-span-2"
          />
        </div>

        <button
          onClick={addLine}
          className="mt-3 w-full bg-black text-white py-2 rounded"
        >
          Agregar línea
        </button>

        <div className="mt-3 border rounded p-2 max-h-40 overflow-auto text-sm">
          {localLines.map((l, i) => (
            <div key={i}>
              {l.code} — {l.pounds} lbs
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-4">
          {boxNo != null && (
            <button
              onClick={removeBox}
              className="text-red-600 underline"
            >
              Eliminar caja
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="border px-4 py-2 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


