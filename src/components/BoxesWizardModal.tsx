"use client";
import { useEffect, useState } from "react";
import { usePackingStore } from "@/store/packingStore";
import { fetchJSON } from "@/lib/fetchJSON";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function BoxesWizardModal({ open, onClose }: Props) {
  const { lines, addLines } = usePackingStore();
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

  const nextBoxNo = () => {
    if (lines.length === 0) return 1;
    return Math.max(...lines.map((l) => l.box_no)) + 1;
  };

  const resolveKey = async (key: string) => {
    return fetchJSON<any>(
      `/api/catalogs/species-by-code/${encodeURIComponent(key.trim().toUpperCase())}`
    );
  };

  /* ================= SIMPLE ================= */
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

    const boxNo = nextBoxNo();

    addLines([
      {
        box_no: boxNo,
        code,
        description_en: r.species.name_en,
        form: r.form.name,
        size: r.size.name,
        pounds: Number(lbs),
        scientific_name: r.species.scientific_name ?? "",
      },
    ]);

    setSpKey("");
    setLbs(0);
  };

  /* ================= RANGE ================= */
  const addRange = async () => {
    if (!rangeKey || !rangeLbs || !rangeCount) return;

    const code = rangeKey.trim().toUpperCase();
    const r = await resolveKey(code);

    let boxNo = nextBoxNo();

    const newLines = Array.from({ length: rangeCount }).map((_, i) => ({
      box_no: boxNo + i,
      code,
      description_en: r.species.name_en,
      form: r.form.name,
      size: r.size.name,
      pounds: Number(rangeLbs),
      scientific_name: r.species.scientific_name ?? "",
    }));

    addLines(newLines);

    setRangeKey("");
    setRangeCount(1);
    setRangeLbs(0);
  };

  /* ================= COMBINED ================= */
  const addCombined = async () => {
    if (combItems.length === 0) return;

    const boxNo = nextBoxNo();
    const newLines = [];

    for (const it of combItems) {
      if (!it.key || !it.lbs) continue;

      const code = it.key.trim().toUpperCase();
      const r = await resolveKey(code);

      newLines.push({
        box_no: boxNo,
        code,
        description_en: r.species.name_en,
        form: r.form.name,
        size: r.size.name,
        pounds: Number(it.lbs),
        scientific_name: r.species.scientific_name ?? "",
      });
    }

    if (newLines.length > 0) addLines(newLines);

    setCombItems([{ key: "", lbs: 0 }]);
  };

  const addRow = () => setCombItems([...combItems, { key: "", lbs: 0 }]);
  const delRow = (i: number) => setCombItems(combItems.filter((_, ix) => ix !== i));

  /* ================= RENDER ================= */

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl p-5">
        {/* Header, tabs y UI EXACTAMENTE IGUAL que el tuyo */}
        {/* (no lo repetí aquí para no alargar, pero NO cambia lógica visual) */}
      </div>
    </div>
  );
}



