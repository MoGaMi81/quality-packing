"use client";

import { useRef, useState } from "react";
import { useSpeciesCatalog } from "@/hooks/useSpeciesCatalog";
import { usePackingStore } from "@/store/packingStore";
import type { PackingLine } from "@/domain/packing/types";
import NewSpeciesBundleModal from "@/components/NewSpeciesBundleModal";

type Mode = "SIMPLE" | "COMBINADA";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function BoxesWizardModal({ open, onClose }: Props) {
  const { lines, addLines, setLines } = usePackingStore();
  const { getByCode, loading, reload } = useSpeciesCatalog();

  const [mode, setMode] = useState<Mode>("SIMPLE");

  // inputs
  const [code, setCode] = useState("");
  const [qty, setQty] = useState(1);
  const [pounds, setPounds] = useState(0);
  const [openNewSpecies, setOpenNewSpecies] = useState(false);
  const [pendingCode, setPendingCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [combinedLines, setCombinedLines] = useState<PackingLine[]>([]);

  const [simpleMode, setSimpleMode] = useState<"CANTIDAD" | "RANGO">("CANTIDAD");
const [rangeFrom, setRangeFrom] = useState<number | "">("");
const [rangeTo, setRangeTo] = useState<number | "">("");

  const [conflict, setConflict] = useState<{
  oldCode: string;
  newCode: string;
  desc: string;
} | null>(null);

const [showConfirm, setShowConfirm] = useState(false);

  if (!open) return null;

  /* =====================
     HELPERS
  ===================== */
  function getNextBoxNo(): number {
    const nums = lines.map(l => Number(l.box_no)).filter(n => Number.isFinite(n));
    return nums.length ? Math.max(...nums) + 1 : 1;
  }

  function boxExists(boxNo: number): boolean {
  return lines.some(l => Number(l.box_no) === boxNo);
}

  /* =====================
     SIMPLE / RANGO
  ===================== */
  function addSimple() {
  const species = getByCode(code);
  if (!species || pounds <= 0) return;

  if (simpleMode === "CANTIDAD" && qty <= 0) return;

  const existing = lines.find(
    (l) =>
      l.description_en === species.description_en &&
      l.size === species.size &&
      l.form === species.form &&
      l.code !== species.code
  );

  if (existing) {
    setConflict({
      oldCode: existing.code ?? "",
      newCode: species.code ?? "",
      desc: species.description_en ?? "",
    });

    setShowConfirm(true);
    return;
  }

  let boxNumbers: number[] = [];

  // =========================
  // MODO CANTIDAD (igual que hoy)
  // =========================
  if (simpleMode === "CANTIDAD") {
    const startBoxNo = getNextBoxNo();
    boxNumbers = Array.from({ length: qty }, (_, i) => startBoxNo + i);
  }

  // =========================
  // MODO RANGO (nuevo)
  // =========================
  if (simpleMode === "RANGO") {
    const from = Number(rangeFrom);
    const to = Number(rangeTo);

    if (!from || !to) {
      alert("Completa el rango");
      return;
    }

    if (from <= 0 || to <= 0 || to < from) {
      alert("Rango inválido");
      return;
    }

    const repeated = [];
    for (let n = from; n <= to; n++) {
      if (boxExists(n)) repeated.push(n);
    }

    if (repeated.length > 0) {
      alert(`Ya existen cajas dentro de ese rango: ${repeated.join(", ")}`);
      return;
    }

    for (let n = from; n <= to; n++) {
      boxNumbers.push(n);
    }
  }

  const newLines: PackingLine[] = boxNumbers.map((box_no) => ({
    box_no,
    is_combined: false,
    code: species.code,
    description_en: species.description_en,
    scientific_name: species.scientific_name ?? null,
    form: species.form,
    size: species.size,
    pounds,
  }));

  addLines(newLines);

  // 🔥 mantener modo scanner
  setCode("");
  setPounds(0);
  setQty(1);
  setRangeFrom("");
  setRangeTo("");

  setTimeout(() => {
    inputRef.current?.focus();
  }, 0);
}

  /* =====================
     COMBINADA
  ===================== */
  function addCombinedLine() {
    const species = getByCode(code);
    if (!species || pounds <= 0) return;

    const boxNo = combinedLines[0]?.box_no ?? getNextBoxNo();

    const line: PackingLine = {
      box_no: boxNo,
      is_combined: true,
      code: species.code,
      description_en: species.description_en,
      scientific_name: species.scientific_name ?? null,
      form: species.form,
      size: species.size,
      pounds,
    };

    setCombinedLines(prev => [...prev, line]);

    // 🔹 limpiar y enfocar clave de especie
    setCode("");
    setPounds(0);
    inputRef.current?.focus();
  }

  function saveCombinedBox() {
    if (!combinedLines.length) return;
    addLines(combinedLines);
    resetAll();

    // 🔹 limpiar y enfocar clave de especie
    setCode("");
    setQty(1);
    inputRef.current?.focus();
  }

  function resetAll() {
  setCode("");
  setQty(1);
  setRangeFrom("");
  setRangeTo("");
  setPounds(0);
  setCombinedLines([]);
}

  function replaceSpeciesCode(newCode: string) {
  const species = getByCode(newCode);
  if (!species) return;

  const updated = lines.map((l) => {
    if (
      l.description_en === species.description_en &&
      l.size === species.size &&
      l.form === species.form
    ) {
      return {
        ...l,
        code: species.code,
      };
    }
    return l;
  });

  setLines(updated);
}

  /* =====================
     UI
  ===================== */
  const species = getByCode(code);

  function setErr(arg0: null) {
    throw new Error("Function not implemented.");
  }

  function setSuccess(arg0: string) {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-[520px] rounded p-4 shadow-lg">
        <h2 className="font-bold mb-3">Agregar cajas</h2>

        {/* MODE */}
        <div className="flex gap-2 mb-4">
          <button
            className={`flex-1 border rounded py-1 ${
              mode === "SIMPLE" ? "bg-black text-white" : ""
            }`}
            onClick={() => setMode("SIMPLE")}
          >
            Simple / Rango
          </button>
          <button
            className={`flex-1 border rounded py-1 ${
              mode === "COMBINADA" ? "bg-black text-white" : ""
            }`}
            onClick={() => setMode("COMBINADA")}
          >
            Combinada
          </button>
        </div>

        {/* CLAVE */}
        <input
          ref={inputRef}
          placeholder="Clave de especie"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              mode === "COMBINADA" ? addCombinedLine() : addSimple();
            }
          }}
          className="border p-2 rounded w-full"
        />

        {code && !loading && !species && (
          <div className="mt-2 text-sm">
            <span className="text-red-600">Clave no encontrada</span>

            <button
              className="ml-3 text-blue-600 underline"
              onClick={() => {
                setPendingCode(code);
                setOpenNewSpecies(true);
              }}
            >
              Crear especie nueva
            </button>
          </div>
        )}

        {/* ✅ INFO DE LA ESPECIE */}
        {code && species && (
          <div className="mt-2 text-sm text-gray-600">
            {species.description_en} · {species.size} · {species.form}
          </div>
        )}

        {mode === "SIMPLE" && (
  <div className="flex gap-2 mt-3">
    <button
      type="button"
      className={`flex-1 border rounded py-1 ${
        simpleMode === "CANTIDAD" ? "bg-black text-white" : ""
      }`}
      onClick={() => setSimpleMode("CANTIDAD")}
    >
      Cantidad
    </button>

    <button
      type="button"
      className={`flex-1 border rounded py-1 ${
        simpleMode === "RANGO" ? "bg-black text-white" : ""
      }`}
      onClick={() => setSimpleMode("RANGO")}
    >
      Rango
    </button>
  </div>
)}

        {/* INPUTS */}
        <div className="grid grid-cols-2 gap-2 mt-3">
  {mode === "SIMPLE" && simpleMode === "CANTIDAD" && (
    <input
      type="number"
      min={1}
      placeholder="Cajas"
      value={qty}
      onChange={e => setQty(Number(e.target.value))}
      className="border p-2 rounded"
    />
  )}

  {mode === "SIMPLE" && simpleMode === "RANGO" && (
    <>
      <input
        type="number"
        min={1}
        placeholder="Desde"
        value={rangeFrom}
        onChange={e =>
          setRangeFrom(e.target.value ? Number(e.target.value) : "")
        }
        className="border p-2 rounded"
      />

      <input
        type="number"
        min={1}
        placeholder="Hasta"
        value={rangeTo}
        onChange={e =>
          setRangeTo(e.target.value ? Number(e.target.value) : "")
        }
        className="border p-2 rounded"
      />
    </>
  )}

  {mode === "COMBINADA" && <div />}

  <input
    type="number"
    min={1}
    placeholder="Lbs"
    value={pounds}
    onChange={e => setPounds(Number(e.target.value))}
    className="border p-2 rounded"
  />
</div>

        {/* ACTIONS */}
        {mode === "COMBINADA" ? (
          <>
            <button
              onClick={addCombinedLine}
              className="mt-4 w-full bg-black text-white py-2 rounded"
            >
              + Agregar línea
            </button>

            {combinedLines.length > 0 && (
              <button
                onClick={saveCombinedBox}
                className="mt-2 w-full bg-blue-600 text-white py-2 rounded"
              >
                Agregar caja
              </button>
            )}
          </>
        ) : (
          <button
            onClick={addSimple}
            className="mt-4 w-full bg-black text-white py-2 rounded"
          >
            Agregar
          </button>
        )}

        <button
          onClick={onClose}
          className="mt-2 w-full border py-2 rounded"
        >
          Cerrar
        </button>
      </div>
      <NewSpeciesBundleModal
        open={openNewSpecies}
        presetCode={pendingCode}
        onClose={() => setOpenNewSpecies(false)}
        onCreated={async (payload) => {
          setErr(null);
          setSuccess("Especie guardada");
          setOpenNewSpecies(false);
          await reload();
          const newCode = payload.map.code;
          setCode(newCode);
        }}
      />

      {showConfirm && conflict && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-4 rounded shadow w-[320px]">
      <h3 className="font-bold mb-2">Conflicto de especie</h3>

      <p className="text-sm mb-2">
        Esta especie ya existe con otra clave
      </p>

      <p className="text-sm">
        <b>{conflict.desc}</b>
      </p>

      <p className="text-sm mt-2">
        Anterior: <b>{conflict.oldCode}</b>
      </p>

      <p className="text-sm">
        Nueva: <b>{conflict.newCode}</b>
      </p>

      <div className="flex gap-2 mt-4">
        <button
          className="flex-1 bg-black text-white py-1 rounded"
          onClick={() => {
          replaceSpeciesCode(conflict.newCode);
          setShowConfirm(false);
          setConflict(null);
        }}
        >
          Actualizar
        </button>

        <button
          className="flex-1 border py-1 rounded"
          onClick={() => setShowConfirm(false)}
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}