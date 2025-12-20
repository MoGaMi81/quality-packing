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

  /* ================= SIMPLE / RANGO STATE ================= */
  const [code, setCode] = useState("");
  const [qty, setQty] = useState(1);
  const [pounds, setPounds] = useState(0);

  /* ================= COMBINADA STATE ================= */
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
      throw new Error(`La clave ${code} no existe en el catálogo.`);
    }
    return data.species;
  }

  /* ================= ACTIONS ================= */
  async function addSimpleOrRange() {
    if (!code.trim() || pounds <= 0 || qty <= 0) {
      alert("Clave y lbs son obligatorios.");
      return;
    }

    let species;
    try {
      species = await resolveSpecies(code.trim());
    } catch (e: any) {
      alert(e.message);
      return;
    }

    let boxNo = nextBoxNo();

    for (let i = 0; i < qty; i++) {
      addLine({
        box_no: boxNo++,
        code: species.code,
        description_en: species.description_en,
        form: species.form,
        size: species.size,
        pounds,
        scientific_name: species.scientific_name,
      });
    }

    // reset
    setCode("");
    setQty(1);
    setPounds(0);
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
          throw new Error("Clave y lbs son obligatorios en combinada.");
        }

        const species = await resolveSpecies(l.code);

        addLine({
          box_no: boxNo,
          code: species.code,
          description_en: species.description_en,
          form: species.form,
          size: species.size,
          pounds: l.lbs,
          scientific_name: species.scientific_name,
          is_combined: true,
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
              tab === "simple"
                ? "bg-black text-white"
                : "border"
            }`}
          >
            Simple / Rango
          </button>
          <button
            onClick={() => setTab("combined")}
            className={`px-3 py-1 rounded ${
              tab === "combined"
                ? "bg-black text-white"
                : "border"
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
                onChange={(e) => setQty(Number(e.target.value))}
                className="border p-2 rounded"
              />

              <input
                type="number"
                min={0}
                placeholder="Lbs por caja"
                value={pounds}
                onChange={(e) => setPounds(Number(e.target.value))}
                className="border p-2 rounded"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded"
              >
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
            <h3 className="font-semibold mb-2">
              Caja combinada
            </h3>

            {combinedLines.map((l, i) => (
              <div
                key={i}
                className="grid grid-cols-3 gap-2 mb-2"
              >
                <input
                  placeholder="Clave"
                  value={l.code}
                  onChange={(e) => {
                    const copy = [...combinedLines];
                    copy[i].code =
                      e.target.value.toUpperCase();
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
                    copy[i].lbs = Number(
                      e.target.value
                    );
                    setCombinedLines(copy);
                  }}
                  className="border p-2 rounded"
                />

                <button
                  onClick={() =>
                    setCombinedLines(
                      combinedLines.filter(
                        (_, idx) => idx !== i
                      )
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
                setCombinedLines([
                  ...combinedLines,
                  { code: "", lbs: 0 },
                ])
              }
              className="text-blue-600 underline"
            >
              + Agregar especie
            </button>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded"
              >
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
