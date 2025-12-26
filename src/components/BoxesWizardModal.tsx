"use client";

import { useEffect, useMemo, useState } from "react";
import { usePackingStore } from "@/store/packingStore";
import { useCatalogStore } from "@/store/catalogStore";
import type { PackingLine } from "@/domain/packing/types";
import { sanitizeLine } from "@/lib/sanitizePackingLine";

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
  const { getByCode } = useCatalogStore();

  const [code, setCode] = useState("");
  const [qty, setQty] = useState(1);
  const [pounds, setPounds] = useState(0);
  const [localLines, setLocalLines] = useState<PackingLine[]>([]);

  /* =====================
     Resolver catálogo
  ===================== */
  const catalogItem = useMemo(() => {
    const c = code.trim().toUpperCase();
    if (!c) return null;
    return getByCode(c);
  }, [code, getByCode]);

  /* =====================
     Cargar caja existente
  ===================== */
  useEffect(() => {
    if (!open) return;

    if (boxNo != null) {
      setLocalLines(lines.filter(l => Number(l.box_no) === boxNo));
    } else {
      setLocalLines([]);
    }

    setCode("");
    setQty(1);
    setPounds(0);
  }, [open, boxNo, lines]);

  if (!open) return null;

  /* =====================
     Agregar líneas
  ===================== */
  function add() {
    if (!catalogItem) {
      alert("Clave no encontrada en catálogo");
      return;
    }
    if (qty <= 0 || pounds <= 0) return;

    const nextBoxNo =
      boxNo ??
      (lines.length
        ? Math.max(...lines.map(l => Number(l.box_no))) + 1
        : 1);

    const newLines: PackingLine[] = Array.from({ length: qty }).map(() =>
      sanitizeLine({
        box_no: nextBoxNo,
        code: catalogItem.code,
        description_en: catalogItem.description_en,
        form: catalogItem.form,
        size: catalogItem.size,
        pounds,
      })
    );

    setLocalLines(prev => [...prev, ...newLines]);
    setCode("");
    setQty(1);
    setPounds(0);
  }

  /* =====================
     Guardar
  ===================== */
  function save() {
    if (!localLines.length) return;

    if (boxNo != null) {
      const others = lines.filter(l => Number(l.box_no) !== boxNo);
      setLines([...others, ...localLines]);
    } else {
      addLines(localLines);
    }

    onClose();
  }

  /* =====================
     Eliminar caja
  ===================== */
  function removeBox() {
    if (boxNo == null) return;
    setLines(lines.filter(l => Number(l.box_no) !== boxNo));
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-[520px] rounded p-4 shadow-lg">
        <h2 className="font-bold mb-3">
          {boxNo != null ? `Editar Caja #${boxNo}` : "Agregar Caja"}
        </h2>

        <input
          placeholder="Clave"
          value={code}
          onChange={e => setCode(e.target.value)}
          className="border p-2 rounded w-full"
        />

        {catalogItem && (
          <div className="bg-gray-100 p-2 rounded text-sm mt-2">
            <div className="font-semibold">{catalogItem.description_en}</div>
            <div>{catalogItem.form} — {catalogItem.size}</div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-3">
          <input
            type="number"
            min={1}
            placeholder="Cajas"
            value={qty}
            onChange={e => setQty(Number(e.target.value))}
            className="border p-2 rounded"
          />

          <input
            type="number"
            min={1}
            placeholder="Lbs por caja"
            value={pounds}
            onChange={e => setPounds(Number(e.target.value))}
            className="border p-2 rounded"
          />
        </div>

        <button
          onClick={add}
          className="mt-3 w-full bg-black text-white py-2 rounded"
        >
          Agregar
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
            <button onClick={removeBox} className="text-red-600 underline">
              Eliminar caja
            </button>
          )}

          <div className="flex gap-2">
            <button onClick={onClose} className="border px-4 py-2 rounded">
              Cancelar
            </button>
            <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
