"use client";
import { useState } from "react";
import { findSpeciesByCode } from "@/lib/finders";
import NewSpeciesBundleModal from "@/components/NewSpeciesBundleModal";

export function useSpeciesResolver() {
  const [open, setOpen] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [resolved, setResolved] = useState<any | null>(null);

  const ask = (code: string) => {
    const found = findSpeciesByCode(code);
    if (found) { setResolved(found); return { ok:true, data: found }; }
    setPendingCode(code);
    setOpen(true);
    return { ok:false as const };
  };

  const modal = (
    <NewSpeciesBundleModal
      open={open}
      presetCode={pendingCode ?? ""}
      onClose={() => setOpen(false)}
      onCreated={() => {
        // después de crear, volvemos a resolver para tener los objetos actualizados
        const solved = findSpeciesByCode(pendingCode ?? "");
        setResolved(solved);
        setOpen(false);
      }}
    />
  );

  return { ask, modal, resolved };
}
