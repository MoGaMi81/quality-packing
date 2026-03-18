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
  const { lines, addLines } = usePackingStore();
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

  if (!open) return null;

  /* =====================
     HELPERS
  ===================== */
  function getNextBoxNo(): number {
    const nums = lines.map(l => Number(l.box_no)).filter(n => Number.isFinite(n));
    return nums.length ? Math.max(...nums) + 1 : 1;
  }

 /* =====================
   SIMPLE / RANGO
===================== */
function addSimple() {
  const species = getByCode(code);
  if (!species || pounds <= 0 || qty <= 0) return;

  const startBoxNo = getNextBoxNo();

  const newLines: PackingLine[] = Array.from({ length: qty }, (_, i) => ({
    box_no: startBoxNo + i,
    is_combined: false,
    code: species.code,
    description_en: species.description_en,
    scientific_name: species.scientific_name ?? null,
    form: species.form,
    size: species.size,
    pounds,
  }));

  addLines(newLines);
  resetAll();

  // 🔹 limpiar y enfocar
  setCode("");
  setQty(1);
  inputRef.current?.focus();
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

  // 🔹 limpiar y enfocar
  setCode("");
  setPounds(0);
  inputRef.current?.focus();
}

function saveCombinedBox() {
  if (!combinedLines.length) return;
  addLines(combinedLines);
  resetAll();

  // 🔹 limpiar y enfocar
  setCode("");
  setQty(1);
  inputRef.current?.focus();
}

function resetAll() {
  setCode("");
  setQty(1);
  setPounds(0);
  setCombinedLines([]);
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
          placeholder="Clave de especie"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
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

        {/* INPUTS */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {mode === "SIMPLE" && (
            <input
              type="number"
              min={1}
              placeholder="Cajas"
              value={qty}
              onChange={e => setQty(Number(e.target.value))}
              className="border p-2 rounded"
            />
          )}

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

  // 🔄 refrescar catálogo
  await reload();

  // 🔥 ahora sí ya existe en memoria
  const newCode = payload.map.code;
  setCode(newCode);
}}
/>
    </div>
  );
}