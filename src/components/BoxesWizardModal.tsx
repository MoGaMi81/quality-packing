"use client";

import { useState } from "react";
import { usePackingStore } from "@/store/packingStore";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Tab = "simple" | "combined";

type CombinedInput = {
  code: string;
  lbs: number;
};

export default function BoxesWizardModal({ open, onClose }: Props) {
  if (!open) return null;

  /* ================= STORE ================= */
  const addLine = usePackingStore((s) => s.addLine);
  const lines = usePackingStore((s) => s.lines);

  /* ================= UI STATE ================= */
  const [tab, setTab] = useState<Tab>("simple");

  /* ================= SIMPLE / RANGO ================= */
  const [code, setCode] = useState("");
  const [qty, setQty] = useState(1);
  const [pounds, setPounds] = useState(0);

  const [specie, setSpecie] = useState<any | null>(null);
  const [loadingSpecie, setLoadingSpecie] = useState(false);

  /* ================= COMBINADA ================= */
  const [combined, setCombined] = useState<CombinedInput[]>([
    { code: "", lbs: 0 },
  ]);

  /* ================= HELPERS ================= */
  function nextBoxNo() {
    return lines.length > 0
      ? Math.max(...lines.map((l) => l.box_no)) + 1
      : 1;
  }

  async function fetchSpecies(code: string) {
    const r = await fetch(
      `/api/species/by-code/${encodeURIComponent(code.toUpperCase())}`
    );
    const data = await r.json();
    if (!data.ok) throw new Error("Especie no encontrada");
    return data.species;
  }

  /* ================= SIMPLE / RANGO ================= */
  async function onChangeCode(v: string) {
    const value = v.toUpperCase();
    setCode(value);
    setSpecie(null);

    if (!value) return;

    setLoadingSpecie(true);
    try {
      const s = await fetchSpecies(value);
      setSpecie(s);
    } catch {
      setSpecie(null);
    } finally {
      setLoadingSpecie(false);
    }
  }

  async function addSimpleOrRange() {
    if (!specie || pounds <= 0 || qty <= 0) {
      alert("Clave válida, cantidad y lbs son obligatorios.");
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

  /* ================= COMBINADA ================= */
  async function addCombined() {
    const valid = combined.filter((c) => c.code && c.lbs > 0);
    if (valid.length === 0) {
      alert("Agrega al menos una especie con lbs.");
      return;
    }

    const boxNo = nextBoxNo();

    try {
      for (const c of valid) {
        const s = await fetchSpecies(c.code);

        addLine({
          box_no: boxNo,
          code: s.code,
          description_en: s.description_en,
          form: s.form,
          size: s.size,
          pounds: c.lbs,
          scientific_name: s.scientific_name,
        });
      }

      setCombined([{ code: "", lbs: 0 }]);
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
            className={`px-4 py-1 rounded ${
              tab === "simple" ? "bg-black text-white" : "border"
            }`}
          >
            Simple / Rango
          </button>
          <button
            onClick={() => setTab("combined")}
            className={`px-4 py-1 rounded ${
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
              <div className="mt-3 p-3 border rounded bg-gray-50 text-sm">
                <div className="font-semibold">
                  {specie.description_en}
                </div>
                <div>
                  {specie.form} {specie.size}
                </div>
                <div className="italic">
                  {specie.scientific_name}
                </div>
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
            {combined.map((c, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                <input
                  placeholder="Clave"
                  value={c.code}
                  onChange={(e) => {
                    const copy = [...combined];
                    copy[i].code = e.target.value.toUpperCase();
                    setCombined(copy);
                  }}
                  className="border p-2 rounded"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Lbs"
                  value={c.lbs}
                  onChange={(e) => {
                    const copy = [...combined];
                    copy[i].lbs = Number(e.target.value);
                    setCombined(copy);
                  }}
                  className="border p-2 rounded"
                />
                <button
                  onClick={() =>
                    setCombined(combined.filter((_, idx) => idx !== i))
                  }
                  className="text-red-600"
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              onClick={() => setCombined([...combined, { code: "", lbs: 0 }])}
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

