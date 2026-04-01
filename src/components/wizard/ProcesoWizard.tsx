"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { useRouter } from "next/navigation";
import { getRoleSafe } from "@/lib/session"; // ✅ NUEVO

// ✅ reemplazo de "can"
const can = {
  startPacking: (r: string | null) =>
    r === "proceso" || r === "admin",
};

export default function ProcesoWizard() {
  const [open, setOpen] = useState(false);
  const [invoice, setInvoice] = useState("");
  const [role, setRole] = useState<string | null>(null); // ✅ NUEVO
  const router = useRouter();

  // ✅ leer sesión correctamente
  useEffect(() => {
    setRole(getRoleSafe());
  }, []);

  const continueOrRoute = async () => {
    const inv = invoice?.trim().toUpperCase();
    if (!inv) return;

    const r = await fetch(
      `/api/invoices/check?no=${encodeURIComponent(inv)}`
    );
    const data = await r.json();

    // ==============================
    //     SI YA EXISTE FACTURA
    // ==============================
    if (data.exists) {
      if (role === "proceso") {
        const go = confirm(
          `La factura ${inv} ya existe.\n¿Deseas abrirla en edición?`
        );
        if (go) router.replace(`/packings/${inv}/edit`);
        setOpen(false);
        return;
      }

      if (role === "facturacion") {
        const go = confirm(
          `La factura ${inv} ya existe.\n¿Ver factura?`
        );
        if (go) router.replace(`/packings/${inv}/view`);
        setOpen(false);
        return;
      }

      if (role === "admin") {
        const opt = prompt(
          `La factura ${inv} ya existe.\nOpciones: view, edit, pricing, export`,
          "view"
        );

        if (!opt) return;
        const cmd = opt.toLowerCase();

        if (cmd === "view") router.replace(`/packings/${inv}/view`);
        if (cmd === "edit") router.replace(`/packings/${inv}/edit`);
        if (cmd === "pricing") router.replace(`/packings/${inv}/pricing`);
        if (cmd === "export")
          window.location.href = `/api/export/excel?invoice=${inv}`;

        setOpen(false);
        return;
      }
    }

    // ==============================
    //     SI NO EXISTE FACTURA
    // ==============================
    if (!can.startPacking(role)) {
      alert("No tienes permiso para crear un nuevo packing.");
      return;
    }

    router.replace(`/packings?invoice=${inv}`);
    setOpen(false);
  };

  // 🔒 evitar glitch visual
  if (role === null) return null;

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