"use client";
import { useState } from "react";
import { findClientByCode } from "@/lib/finders";
import NewClientModal from "@/components/NewClientModal";

export function useClientResolver() {
  const [open, setOpen] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [resolved, setResolved] = useState<any | null>(null);

  const ask = (code: string) => {
    const found = findClientByCode(code);
    if (found) { setResolved(found); return { ok:true, client: found }; }
    setPendingCode(code);
    setOpen(true);
    return { ok:false as const };
  };

  const modal = (
    <NewClientModal
      open={open}
      presetCode={pendingCode ?? ""}
      onClose={() => setOpen(false)}
      onCreated={(c) => { setResolved(c); setOpen(false); }}
    />
  );

  return { ask, modal, resolved };
}
