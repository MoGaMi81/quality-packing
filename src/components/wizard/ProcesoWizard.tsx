"use client";
import { useState } from "react";
import Modal from "@/components/Modal";
import { useRouter } from "next/navigation";

export default function NewPackingButton() {
  const [open, setOpen] = useState(false);
  const [invoice, setInvoice] = useState("");
  const router = useRouter();

  const continueOrRoute = async () => {
    const inv = invoice.trim().toUpperCase();
    if (!inv) return;
    const r = await fetch(`/api/packing/check-invoice?invoice=${encodeURIComponent(inv)}`);
    const data = await r.json();
    if (data.exists) {
      const opt = prompt(`Invoice ${inv} ya existe.\nOpciones: view, edit, export`, "view");
      if (!opt) return;
      if (opt.toLowerCase().startsWith("v")) router.push(`/packing/view?invoice=${inv}`);
      else if (opt.toLowerCase().startsWith("e")) router.push(`/packing?invoice=${inv}`);
      else if (opt.toLowerCase().startsWith("ex")) window.location.href = `/api/packing/export?invoice=${inv}`;
      setOpen(false);
      return;
    }
    // si no existe → navegar a captura (limpia store)
    router.push(`/packing?invoice=${inv}`);
    setOpen(false);
  };

  return (
    <>
      <button className="rounded border px-3 py-1" onClick={() => setOpen(true)}>
        Agregar Packing
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo Packing">
        <div className="space-y-3">
          <label className="block text-sm font-medium">Invoice #</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={invoice}
            onChange={e => setInvoice(e.target.value)}
            placeholder="p. ej. 1A"
          />
          <div className="flex justify-end gap-2">
            <button className="rounded border px-3 py-2" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="rounded bg-black px-3 py-2 text-white" onClick={continueOrRoute}>Continuar</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
