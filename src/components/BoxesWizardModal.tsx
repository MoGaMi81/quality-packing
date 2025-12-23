"use client";

import { useEffect, useState } from "react";
import { usePackingStore } from "@/store/packingStore";
import type { PackingLine } from "@/domain/packing/types";

type Props = {
  open: boolean;
  onClose: () => void;
  boxNo?: number; // 👈 undefined = nueva caja
};

export default function BoxesWizardModal({
  open,
  onClose,
  boxNo,
}: Props) {
  const { lines, setLines } = usePackingStore();

  const [localLines, setLocalLines] = useState<PackingLine[]>([]);
  const [code, setCode] = useState("");
  const [pounds, setPounds] = useState<number>(0);

  /* =========================
     Cargar caja existente
  ========================= */
  useEffect(() => {
    if (!open) return;

    if (boxNo != null) {
      const existing = lines.filter(
        (l) => Number(l.box_no) === boxNo
      );
      setLocalLines(existing);
    } else {
      setLocalLines([]);
    }

    setCode("");
    setPounds(0);
  }, [open, boxNo, lines]);

  if (!open) return null;

  /* =========================
     Agregar línea a la caja
  ========================= */
  function addLine() {
    if (!code || pounds <= 0) return;

    const newLine: PackingLine = {
      box_no: boxNo ?? nextBoxNo(),
      code,
      description_en: code,        // 🔒 requerido
      form: "",
      size: "",
      pounds,
      scientific_name: "",          // 🔒 requerido
    };

    setLocalLines((prev) => [...prev, newLine]);
    setCode("");
    setPounds(0);
  }

  /* =========================
     Guardar caja
  ========================= */
  function save() {
    if (localLines.length === 0) return;

    const targetBoxNo = localLines[0].box_no;

    const others = lines.filter(
      (l) => Number(l.box_no) !== Number(targetBoxNo)
    );

    setLines([...others, ...localLines]);
    onClose();
  }

  /* =========================
     Util: siguiente caja
  ========================= */
  function nextBoxNo() {
    if (lines.length === 0) return 1;
    return (
      Math.max(...lines.map((l) => Number(l.box_no))) + 1
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="modal">
      <h2>
        Caja {boxNo ?? "Nueva"}
        {localLines.length > 1 && " (Combinada)"}
      </h2>

      {localLines.map((l, i) => (
        <div key={i}>
          {l.code} — {l.pounds} lbs
        </div>
      ))}

      <hr />

      <input
        placeholder="Código"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <input
        type="number"
        placeholder="Lbs"
        value={pounds}
        onChange={(e) => setPounds(Number(e.target.value))}
      />

      <button onClick={addLine}>Agregar especie</button>

      <hr />

      <button onClick={save}>Guardar caja</button>
      <button onClick={onClose}>Cancelar</button>
    </div>
  );
}
