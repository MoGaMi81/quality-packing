"use client";
import { useEffect, useState } from "react";
import { usePackingStore } from "@/store/packingStore";
import { fetchJSON } from "@/lib/fetchJSON";

type SimpleItem = {
  code: string;
  description_en: string;
  form: string;
  size: string;
  pounds: number;
};

type Props = { 
  open: boolean; 
  onClose: () => void; 
  editBoxNo?: number | null 
};

export default function BoxesWizardModal({ open, onClose, editBoxNo = null }: Props) {
  const { addLine } = usePackingStore();
  const [tab, setTab] = useState<"simple" | "range" | "combined">("simple");

  // SIMPLE
  const [spKey, setSpKey] = useState("");
  const [lbs, setLbs] = useState<number>(0);

  // RANGE
  const [rangeKey, setRangeKey] = useState("");
  const [rangeCount, setRangeCount] = useState<number>(1);
  const [rangeLbs, setRangeLbs] = useState<number>(0);

  // COMBINED
  const [combItems, setCombItems] = useState<{ key: string; lbs: number }[]>([
    { key: "", lbs: 0 },
  ]);

  useEffect(() => {
    if (!open) setTab("simple");
  }, [open]);

  if (!open) return null;

  const resolveKey = async (key: string) => {
    const r = await fetchJSON<any>(
      `/api/catalogs/species-by-code/${encodeURIComponent(key.trim().toUpperCase())}`
    );
    return r;
  };

  // ----------------------------------------------------------
  // SIMPLE
  // ----------------------------------------------------------
  const addSimple = async () => {
    if (!spKey || !lbs) return;

    const code = spKey.trim().toUpperCase();

    let r;
    try {
      r = await resolveKey(code);
    } catch {
      const create = confirm(`Clave ${code} no existe. ¿Deseas crear la especie ahora?`);
      if (!create) return;

      const name_en = prompt("Nombre (EN):");
      if (!name_en) return;

      const size = prompt("Size (p.ej., 1-2):") || "";
      const form = prompt("Form (W&G / FILLET):") || "W&G";
      const scientific_name = prompt("Scientific name:") || "";

      await fetchJSON("/api/catalogs/new-species", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name_en, size, form, scientific_name }),
      });

      r = await resolveKey(code);
    }

    const item: SimpleItem = {
      code,
      description_en: r.species.name_en,
      form: r.form.name,
      size: r.size.name,
      pounds: Number(lbs),
    };

    addLine(item, editBoxNo ?? undefined);

    setSpKey("");
    setLbs(0);
  };

  // ----------------------------------------------------------
  // RANGE
  // ----------------------------------------------------------
  const addRange = async () => {
    if (!rangeKey || !rangeLbs || !rangeCount) return;

    const code = rangeKey.trim().toUpperCase();
    const r = await resolveKey(code);

    const item: SimpleItem = {
      code,
      description_en: r.species.name_en,
      form: r.form.name,
      size: r.size.name,
      pounds: Number(rangeLbs),
    };

    for (let i = 0; i < rangeCount; i++) {
      addLine(item);
    }

    setRangeKey("");
    setRangeCount(1);
    setRangeLbs(0);
  };

  // ----------------------------------------------------------
  // COMBINED
  // ----------------------------------------------------------
  const addCombined = async () => {
    if (combItems.length === 0) return;

    let boxNoFixed: number | undefined = undefined;

    for (let ix = 0; ix < combItems.length; ix++) {
      const it = combItems[ix];
      if (!it.key || !it.lbs) continue;

      const code = it.key.trim().toUpperCase();
      const r = await resolveKey(code);

      const item: SimpleItem = {
        code,
        description_en: r.species.name_en,
        form: r.form.name,
        size: r.size.name,
        pounds: Number(it.lbs),
      };

      // Primera fila crea la caja nueva
      if (boxNoFixed === undefined) {
        addLine(item);
        const last = usePackingStore.getState().lines.slice(-1)[0];
        boxNoFixed = last?.box_no ?? undefined;
      } else {
        addLine(item, boxNoFixed);
      }
    }

    setCombItems([{ key: "", lbs: 0 }]);
  };

  const addRow = () => setCombItems([...combItems, { key: "", lbs: 0 }]);
  const delRow = (i: number) => setCombItems(combItems.filter((_, ix) => ix !== i));

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">Agregar cajas</h2>
          <button className="px-3 py-1 border rounded" onClick={onClose}>
            Cerrar
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab("simple")}
            className={`px-3 py-1 rounded border ${
              tab === "simple" ? "bg-black text-white" : ""
            }`}
          >
            Simple
          </button>
          <button
            onClick={() => setTab("range")}
            className={`px-3 py-1 rounded border ${
              tab === "range" ? "bg-black text-white" : ""
            }`}
          >
            Rango
          </button>
          <button
            onClick={() => setTab("combined")}
            className={`px-3 py-1 rounded border ${
              tab === "combined" ? "bg-black text-white" : ""
            }`}
          >
            Combinada
          </button>
        </div>

        {/* SIMPLE */}
        {tab === "simple" && (
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="text-sm">Clave especie</label>
              <input
                className="border rounded px-2 py-1 w-full"
                value={spKey}
                onChange={(e) => setSpKey(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm">Lbs</label>
              <input
                className="border rounded px-2 py-1 w-full"
                type="number"
                value={lbs}
                onChange={(e) => setLbs(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end">
              <button
                className="px-3 py-1 bg-black text-white rounded w-full"
                onClick={addSimple}
              >
                Agregar
              </button>
            </div>
          </div>
        )}

        {/* RANGE */}
        {tab === "range" && (
          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-3">
              <label className="text-sm">Clave especie</label>
              <input
                className="border rounded px-2 py-1 w-full"
                value={rangeKey}
                onChange={(e) => setRangeKey(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm">Lbs/caja</label>
              <input
                className="border rounded px-2 py-1 w-full"
                type="number"
                value={rangeLbs}
                onChange={(e) => setRangeLbs(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="text-sm">No. cajas</label>
              <input
                className="border rounded px-2 py-1 w-full"
                type="number"
                value={rangeCount}
                onChange={(e) => setRangeCount(Number(e.target.value))}
              />
            </div>

            <div className="flex items-end">
              <button
                className="px-3 py-1 bg-black text-white rounded w-full"
                onClick={addRange}
              >
                Agregar
              </button>
            </div>
          </div>
        )}

        {/* COMBINED */}
        {tab === "combined" && (
          <div className="space-y-3">
            {combItems.map((it, ix) => (
              <div key={ix} className="grid grid-cols-6 gap-3">
                <div className="col-span-4">
                  <label className="text-sm">Clave especie</label>
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={it.key}
                    onChange={(e) =>
                      setCombItems((ci) =>
                        ci.map((c, j) =>
                          j === ix ? { ...c, key: e.target.value } : c
                        )
                      )
                    }
                  />
                </div>

                <div>
                  <label className="text-sm">Lbs</label>
                  <input
                    className="border rounded px-2 py-1 w-full"
                    type="number"
                    value={it.lbs}
                    onChange={(e) =>
                      setCombItems((ci) =>
                        ci.map((c, j) =>
                          j === ix ? { ...c, lbs: Number(e.target.value) } : c
                        )
                      )
                    }
                  />
                </div>

                <div className="flex items-end">
                  <button className="px-3 py-1 border rounded w-full" onClick={() => delRow(ix)}>
                    Quitar
                  </button>
                </div>
              </div>
            ))}

            <div className="flex justify-between">
              <button className="px-3 py-1 border rounded" onClick={addRow}>
                + Línea
              </button>
              <button className="px-3 py-1 bg-black text-white rounded" onClick={addCombined}>
                Agregar caja
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


