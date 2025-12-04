//src/components/ProcesoWizard.tsx

"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { useRouter } from "next/navigation";
import { getRole, can } from "@/lib/role";   // ← IMPORTANTE

export default function ProcesoWizard() {
  const [open, setOpen] = useState(false);
  const [invoice, setInvoice] = useState("");
  const router = useRouter();

  const role = getRole() ?? "proceso"; // proceso | facturacion | admin

  const continueOrRoute = async () => {
    const inv = invoice.trim().toUpperCase();
    if (!inv) return;

    // --- NUEVA API EN SUPABASE ---
    const r = await fetch(`/api/invoices/check?no=${encodeURIComponent(inv)}`);
    const data = await r.json();

    // ==============================
    //     SI YA EXISTE FACTURA
    // ==============================
    if (data.exists) {
      // ---- ROL PROCESO ----
      if (role === "proceso") {
        const go = confirm(
          `La factura ${inv} ya existe.\n¿Deseas abrirla en edición?`
        );
        if (go) router.push(`/packing/${inv}/edit`);
        setOpen(false);
        return;
      }

      // ---- ROL FACTURACIÓN ----
      if (role === "facturacion") {
        const go = confirm(`La factura ${inv} ya existe.\n¿Ver factura?`);
        if (go) router.push(`/packing/${inv}/view`);
        setOpen(false);
        return;
      }

      // ---- ROL ADMIN ----
      const opt = prompt(
        `La factura ${inv} ya existe.\nOpciones: view, edit, pricing, export`,
        "view"
      );

      if (!opt) return;
      const cmd = opt.toLowerCase();

      if (cmd === "view") router.push(`/packing/${inv}/view`);
      if (cmd === "edit") router.push(`/packing/${inv}/edit`);
      if (cmd === "pricing") router.push(`/packing/${inv}/pricing`);
      if (cmd === "export")
        window.location.href = `/api/export/excel?invoice=${inv}`;

      setOpen(false);
      return;
    }

    // ==============================
    //     SI **NO** EXISTE FACTURA
    // ==============================
    if (!can.startPacking(role)) {
      alert("No tienes permiso para crear un nuevo packing.");
      return;
    }

    router.push(`/packing?invoice=${inv}`);
    setOpen(false);
  };

  return (
    <>
      <button
        className="rounded border px-3 py-1"
        onClick={() => setOpen(true)}
      >
        Agregar Packing
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo Packing">
        <div className="space-y-3">
          <label className="block text-sm font-medium">Invoice #</label>

          <input
            className="w-full rounded border px-3 py-2"
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
            placeholder="p. ej. 1A"
          />

          <form
  onSubmit={(e) => {
    e.preventDefault();
    continueOrRoute();
  }}
  className="flex justify-end gap-2"
>
  <button
    type="button"
    className="rounded border px-3 py-2"
    onClick={() => setOpen(false)}
  >
    Cancelar
  </button>

  <button
    type="submit"
    className="rounded bg-black px-3 py-2 text-white"
  >
    Continuar
         </button>
         </form>
        </div>
      </Modal>
    </>
  );
}
