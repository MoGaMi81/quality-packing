"use client";

import { useState } from "react";
import { usePackingStore } from "@/store/packingStore";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Tab = "simple" | "combined";

type CombinedLine = {
  code: string;
  lbs: number;
};

export default function BoxesWizardModal({ open, onClose }: Props) {
  if (!open) return null;

  /* ================= STORE ================= */
  const addLine = usePackingStore((s) => s.addLine);
  const lines = usePackingStore((s) => s.lines);

  /* ================= TABS ================= */
  const [tab, setTab] = useState<Tab>("simple");

  /* ================= SIMPLE / RANGO ================= */
  const [code, setCode] = useState("");
  const [qty, setQty] = useState(1);
  const [pounds, setPounds] = useState(0);

  const [specie, setSpecie] = useState<any | null>(null);
  const [loadingSpecie, setLoadingSpecie] = useState(false);

  /* ================= COMBINADA ================= */
  const [combinedLines, setCombinedLines] = useState<CombinedLine[]>([
    { code: "", lbs: 0 },
  ]);

  /* ================= HELPERS ================= */
  function nextBoxNo() {
    return lines.length > 0
      ? Math.max(...lines.map((l) => l.box_no)) + 1
      : 1;
  }

  async function resolveSpecies(code: string) {
    const r = await fetch(
      `/api/species/by-code/${encodeURIComponent(code.toUpperCase())}`
    );
    const data = await r.json();

    if (!data.ok) {
      throw new Error(`La clave ${code} no existe`);
    }

    return data.species;
  }

  /* ================= EFFECT: BUSCAR ESPECIE ================= */
  async function onChangeCode(value: string) {
    const v = value.toUpperCase();
    setCode(v);
    setSpecie(null);

    if (!v) return;

    setLoadingSpecie(true);
    try {
      const s = await resolveSpecies(v);
      setSpecie(s);
    } catch {
      setSpecie(null);
    } finally {
      setLoadingSpecie(false);
    }
  }

  /* ================= ACTIONS ================= */
  async function addSimpleOrRange() {
    if (!specie || pounds <= 0 || qty <= 0) {
      alert("Clave válida, lbs y cantidad son obligatorios.");
      return;
    }

    let boxNo = nextBoxNo();

    for (let i = 0; i < qty; i++) {
      addLine({
        box_no: boxNo++,
        code: specie.code,
        description_en: specie.description_en,
        form: specie.form,
        size: specie.size,
        pounds,
        scientific_name: specie.scientific_name,
      });
    }

    setCode("");
    setQty(1);
    setPounds(0);
    setSpecie(null);
    onClose();
  }

  async function addCombined() {
    if (combinedLines.length === 0) {
      alert("Agrega al menos una especie.");
      return;
    }

    const boxNo = nextBoxNo();

    try {
      for (const l of combinedLines) {
        if (!l.code || l.lbs <= 0) {
          throw new Error("Clave y lbs son obligatorios.");
        }

        const s = await resolveSpecies(l.code);

        addLine({
          box_no: boxNo,
          code: s.code,
          description_en: s.description_en,
          form: s.form,
          size: s.size,
          pounds: l.lbs,
          scientific_name: s.scientific_name,
        });
      }

      setCombinedLines([{ code: "", lbs: 0 }]);
      onClose();
    } catch (e: any) {
      alert(e.message);
    }
  }

  /* ================= UI ================= */
  return (
    <div className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-[560px] p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Agregar cajas</h2>

        {/* ===== TABS ===== */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("simple")}
            className={`px-3 py-1 rounded ${
              tab === "simple" ? "bg-black text-white" : "border"
            }`}
          >
            Simple / Rango
          </button>
          <button
            onClick={() => setTab("combined")}
            className={`px-3 py-1 rounded ${
              tab === "combined" ? "bg-black text-white" : "border"
            }`}
          >
            Combinada
          </button>
        </div>

        {/* ===== SIMPLE / RANGO ===== */}
        {tab === "simple" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Clave"
                value={code}
                onChange={(e) => onChangeCode(e.target.value)}
                className="border p-2 rounded"
              />

              <input
                type="number"
                min={1}
                placeholder="Cantidad cajas"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="border p-2 rounded"
              />

              <input
                type="number"
                min={0}
                placeholder="Lbs por caja"
                value={pounds}
                onChange={(e) => setPounds(Number(e.target.value))}
                className="border p-2 rounded col-span-2"
              />
            </div>

            {loadingSpecie && (
              <div className="text-sm text-gray-400 mt-2">
                Buscando especie…
              </div>
            )}

            {specie && (
              <div className="mt-3 p-2 border rounded bg-gray-50 text-sm">
                <div className="font-semibold">{specie.description_en}</div>
                <div>
                  {specie.form} {specie.size}
                </div>
                <div className="italic">{specie.scientific_name}</div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={onClose} className="px-4 py-2 border rounded">
                Cancelar
              </button>
              <button
                onClick={addSimpleOrRange}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Agregar
              </button>
            </div>
          </>
        )}

        {/* ===== COMBINADA ===== */}
        {tab === "combined" && (
          <>
            <h3 className="font-semibold mb-2">Caja combinada</h3>

            {combinedLines.map((l, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <input
                  placeholder="Clave"
                  value={l.code}
                  onChange={(e) => {
                    const copy = [...combinedLines];
                    copy[i].code = e.target.value.toUpperCase();
                    setCombinedLines(copy);
                  }}
                  className="border p-2 rounded"
                />

                <input
                  type="number"
                  min={0}
                  placeholder="Lbs"
                  value={l.lbs}
                  onChange={(e) => {
                    const copy = [...combinedLines];
                    copy[i].lbs = Number(e.target.value);
                    setCombinedLines(copy);
                  }}
                  className="border p-2 rounded"
                />

                <button
                  onClick={() =>
                    setCombinedLines(
                      combinedLines.filter((_, idx) => idx !== i)
                    )
                  }
                  className="text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              onClick={() =>
                setCombinedLines([...combinedLines, { code: "", lbs: 0 }])
              }
              className="text-blue-600 underline"
            >
              + Agregar especie
            </button>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={onClose} className="px-4 py-2 border rounded">
                Cancelar
              </button>
              <button
                onClick={addCombined}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Agregar combinada
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
