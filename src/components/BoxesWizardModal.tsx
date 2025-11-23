//src/components/BoxesWinzardModal.tsx
"use client";
import { useEffect, useState } from "react";
import { usePackingStore } from "@/store/packingStore";
import { fetchJSON } from "@/lib/fetchJSON";

type SimpleItem = { description_en: string; form: string; size: string; pounds: number };
type Props = { open: boolean; onClose: () => void; editBoxNo?: number|null };

export default function BoxesWizardModal({ open, onClose, editBoxNo = null }: Props) {
  const { header, lines, addLine } = usePackingStore();
  const [tab, setTab] = useState<"simple"|"range"|"combined">("simple");

  // SIMPLE
  const [spKey, setSpKey] = useState("");
  const [spResolved, setSpResolved] = useState<any|null>(null);
  const [lbs, setLbs] = useState<number>(0);

  // RANGE
  const [rangeCount, setRangeCount] = useState<number>(1);
  const [rangeLbs,   setRangeLbs]   = useState<number>(0);
  const [rangeKey,   setRangeKey]   = useState("");

  // COMBINED
  const [combItems, setCombItems] = useState<{ key: string; lbs: number; resolved?: any }[]>([
    { key: "", lbs: 0 },
  ]);

  useEffect(()=>{ if (!open) { setTab("simple"); }},[open]);

  if (!open) return null;

  const resolveKey = async (key: string) => {
    const r = await fetchJSON<any>(`/api/catalogs/species-by-code/${encodeURIComponent(key.trim().toUpperCase())}`);
    return r; // { species, size, form, map }
  };

  const addSimple = async () => {
    if (!spKey || !lbs) return;
    let r;
    try { r = await resolveKey(spKey); }
    catch {
      const create = confirm(`Clave ${spKey} no existe. ¿Deseas crear la especie ahora?`);
      if (!create) return;
      // flujo rápido de alta:
      const name_en = prompt("Nombre (EN):"); if (!name_en) return;
      const size = prompt("Size (p.ej. 1-2):") || "";
      const form = prompt("Form (W&G / FILLET):") || "W&G";
      const scientific_name = prompt("Scientific name:") || "";
      await fetchJSON("/api/catalogs/new-species", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ code: spKey, name_en, size, form, scientific_name }),
      });
      r = await resolveKey(spKey);
    }
    setSpResolved(r);
    const item: SimpleItem = {
      description_en: r.species.name_en,
      form: r.form.name,
      size: r.size.name,
      pounds: Number(lbs),
    };
    // si editBoxNo viene, usamos el box fijo:
    addLine(item, editBoxNo ?? undefined);
    // no cerramos: bucle
    setSpKey(""); setLbs(0);
  };

  const addRange = async () => {
    if (!rangeKey || !rangeLbs || !rangeCount) return;
    const r = await resolveKey(rangeKey);
    const item: SimpleItem = {
      description_en: r.species.name_en,
      form: r.form.name,
      size: r.size.name,
      pounds: Number(rangeLbs),
    };
    // regla SL = siempre N filas (y para todos en general también N filas)
    for (let i=0;i<rangeCount;i++) addLine(item);
    setRangeKey(""); setRangeLbs(0); setRangeCount(1);
  };

  const addCombined = async () => {
    if (combItems.length === 0) return;
    // crear una nueva caja con varias filas (mismo box no)
    // para lograrlo: tomamos el box que usaría la primera addLine y lo fijamos para las demás
    // técnica: hacemos la primera addLine SIN fixedBox y recuperamos lastBoxNo con otra llamada;
    // más simple: 1) obtenemos un box fijo temporal
    let boxNoFixed: number | undefined = undefined;
    for (let ix=0; ix<combItems.length; ix++) {
      const it = combItems[ix];
      if (!it.key || !it.lbs) continue;
      const r = await resolveKey(it.key);
      const item: SimpleItem = {
        description_en: r.species.name_en,
        form: r.form.name,
        size: r.size.name,
        pounds: Number(it.lbs),
      };
      // en la 1a iteración dejamos que el store asigne box nuevo y “aprendemos” el nro:
      if (boxNoFixed === undefined) {
        addLine(item); // crea el nuevo box
        // “aprender” cuál fue:
        // última línea agregada:
        const last = usePackingStore.getState().lines.slice(-1)[0];
        boxNoFixed = last?.box_no ?? undefined;
      } else {
        addLine(item, boxNoFixed);
      }
    }
    // reiniciar formulario
    setCombItems([{ key: "", lbs: 0 }]);
  };

  const addRow = () => setCombItems([...combItems, { key: "", lbs: 0 }]);
  const delRow = (i:number) => setCombItems(combItems.filter((_,ix)=>ix!==i));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl p-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">Agregar cajas</h2>
          <button className="px-3 py-1 border rounded" onClick={onClose}>Cerrar</button>
        </div>

        <div className="flex gap-2 mb-4">
          <button onClick={()=>setTab("simple")}
                  className={`px-3 py-1 rounded border ${tab==="simple"?"bg-black text-white":""}`}>
            Simple
          </button>
          <button onClick={()=>setTab("range")}
                  className={`px-3 py-1 rounded border ${tab==="range"?"bg-black text-white":""}`}>
            Rango
          </button>
          <button onClick={()=>setTab("combined")}
                  className={`px-3 py-1 rounded border ${tab==="combined"?"bg-black text-white":""}`}>
            Combinada
          </button>
        </div>

        {tab==="simple" && (
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="text-sm">Clave especie</label>
              <input className="border rounded px-2 py-1 w-full"
                     value={spKey} onChange={e=>setSpKey(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">Lbs</label>
              <input className="border rounded px-2 py-1 w-full" type="number"
                     value={lbs} onChange={e=>setLbs(Number(e.target.value))} />
            </div>
            <div className="flex items-end">
              <button className="px-3 py-1 bg-black text-white rounded w-full" onClick={addSimple}>
                Agregar
              </button>
            </div>
          </div>
        )}

        {tab==="range" && (
          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-3">
              <label className="text-sm">Clave especie</label>
              <input className="border rounded px-2 py-1 w-full"
                     value={rangeKey} onChange={e=>setRangeKey(e.target.value)} />
            </div>
            <div>
              <label className="text-sm">Lbs/caja</label>
              <input className="border rounded px-2 py-1 w-full" type="number"
                     value={rangeLbs} onChange={e=>setRangeLbs(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm">No. cajas</label>
              <input className="border rounded px-2 py-1 w-full" type="number"
                     value={rangeCount} onChange={e=>setRangeCount(Number(e.target.value))} />
            </div>
            <div className="flex items-end">
              <button className="px-3 py-1 bg-black text-white rounded w-full" onClick={addRange}>
                Agregar
              </button>
            </div>
          </div>
        )}

        {tab==="combined" && (
          <div className="space-y-3">
            {combItems.map((it,ix)=>(
              <div key={ix} className="grid grid-cols-6 gap-3">
                <div className="col-span-4">
                  <label className="text-sm">Clave especie</label>
                  <input className="border rounded px-2 py-1 w-full"
                         value={it.key}
                         onChange={(e)=>setCombItems(ci=>ci.map((c,j)=> j===ix?{...c,key:e.target.value}:c))} />
                </div>
                <div>
                  <label className="text-sm">Lbs</label>
                  <input className="border rounded px-2 py-1 w-full" type="number"
                         value={it.lbs}
                         onChange={(e)=>setCombItems(ci=>ci.map((c,j)=> j===ix?{...c,lbs:Number(e.target.value)}:c))} />
                </div>
                <div className="flex items-end">
                  <button className="px-3 py-1 border rounded w-full" onClick={()=>delRow(ix)}>Quitar</button>
                </div>
              </div>
            ))}
            <div className="flex justify-between">
              <button className="px-3 py-1 border rounded" onClick={addRow}>+ Línea</button>
              <button className="px-3 py-1 bg-black text-white rounded" onClick={addCombined}>Agregar caja</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

