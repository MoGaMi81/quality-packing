// src/components/NewPackingWizard.tsx
"use client";

import { useEffect, useState } from "react";
import { usePackingStore } from "@/store/packingStore";
import { fetchJSON } from "@/lib/fetchJSON";
import type { PackingHeader } from "@/domain/packing/types";
import { getRole, can } from "@/lib/role";

type Props = { open: boolean; onClose: () => void };

export default function NewPackingWizard({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const role = getRole() ?? "proceso";
  const { setHeader } = usePackingStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [invoiceNo, setInvoiceNo] = useState("");
  const [clientCode, setClientCode] = useState("");
  const [clientResolved, setClientResolved] = useState<any | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [guide, setGuide] = useState("");

  if (!mounted || !open) return null;

  // -------- Paso 1: Buscar invoice --------
  const checkInvoice = async () => {
    const v = invoiceNo.trim().toUpperCase();
    if (!v) return;

    const r = await fetchJSON(`/api/invoices/check?no=${encodeURIComponent(v)}`);

    if (r.exists) {
      if (role === "proceso") {
        const go = confirm(`La factura ${v} ya existe.\n¿Abrir en edición?`);
        if (go) window.location.href = `/packing/${v}/edit`;
        return;
      }

      if (role === "facturacion") {
        window.location.href = `/packing/${v}/view`;
        return;
      }

      const opt = prompt(
        `La factura ${v} ya existe.\nOpciones: view, edit, pricing, export`,
        "view"
      );
      if (!opt) return;

      const cmd = opt.toLowerCase();
      if (cmd === "view") window.location.href = `/packing/${v}/view`;
      if (cmd === "edit") window.location.href = `/packing/${v}/edit`;
      if (cmd === "pricing") window.location.href = `/packing/${v}/pricing`;
      if (cmd === "export")
        window.location.href = `/api/export/excel?invoice=${v}`;

      return;
    }

    setStep(2);
  };

  // -------- Paso 2: Buscar cliente --------
  const resolveClient = async () => {
    const code = clientCode.trim().toUpperCase();
    if (!code) return;

    try {
      const c = await fetchJSON(
        `/api/catalogs/client/${encodeURIComponent(code)}`
      );
      setClientResolved(c);
      setStep(3);
    } catch {
      if (!can.startPacking(role)) {
        alert("Cliente no existe y tu rol no puede crearlo.");
        return;
      }

      const go = confirm(
        `Cliente ${code} no existe.\n¿Crear ahora?`
      );
      if (!go) return;

      const name = prompt("Nombre del cliente:");
      if (!name) return;

      const payload = {
        code,
        name,
        address: prompt("Dirección:") || "",
        city: prompt("Ciudad:") || "",
        state: prompt("Estado:") || "",
        country: prompt("País:") || "USA",
        zip: prompt("ZIP:") || "",
        tax_id: prompt("Tax ID:") || "",
      };

      const res = await fetchJSON("/api/catalogs/new-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setClientResolved(res.client);
      setStep(3);
    }
  };

 // -------- Paso 3: Terminar wizard --------
const finishWizard = () => {
  if (!clientResolved) return;

  // Construimos el header COMPLETO y limpio
  const h: PackingHeader = {
    client_code: clientResolved.code.trim(),
    client_name: clientResolved.name.trim(),
    address: clientResolved.address.trim(),
    tax_id: clientResolved.tax_id.trim(),
    guide: guide.trim(),
    invoice_no: invoiceNo.trim().toUpperCase(),
    date: date || new Date().toISOString().slice(0, 10),
  };

  // Guardamos en el store
  setHeader(h);

  // Cerramos wizard
  onClose();
};

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-xl space-y-6">

        {/* TÍTULO */}
        <h2 className="text-2xl font-bold text-center">
          Nuevo Packing
        </h2>

        {/* INDICADOR DE PASO */}
        <div className="text-center text-sm text-gray-500">
          Paso {step} de 3
        </div>

        {/* ------------------ PASO 1 ------------------ */}
        {step === 1 && (
          <div className="space-y-4">
            <label className="font-semibold">Número de Factura (Invoice):</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder="Ej: 1092A"
            />

            <button
              className="bg-black text-white px-4 py-2 rounded w-full"
              onClick={checkInvoice}
            >
              Continuar
            </button>
          </div>
        )}

        {/* ------------------ PASO 2 ------------------ */}
        {step === 2 && (
          <div className="space-y-4">
            <label className="font-semibold">Código del Cliente:</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={clientCode}
              onChange={(e) => setClientCode(e.target.value)}
              placeholder="Codigo..."
            />

            <button
              className="bg-black text-white px-4 py-2 rounded w-full"
              onClick={resolveClient}
            >
              Continuar
            </button>
          </div>
        )}

        {/* ------------------ PASO 3 ------------------ */}
        {step === 3 && (
          <div className="space-y-4">
            <label className="font-semibold">AWB / Guía:</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={guide}
              onChange={(e) => setGuide(e.target.value)}
              placeholder="Ej: SMLU8838614A"
            />

            <label className="font-semibold block">Fecha:</label>
            <input
              type="date"
              className="border rounded px-3 py-2 w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <button
              className="bg-green-600 text-white px-4 py-2 rounded w-full"
              onClick={finishWizard}
            >
              Iniciar Packing
            </button>
          </div>
        )}

        {/* CANCELAR */}
        <button
          className="text-center text-red-500 text-sm underline w-full"
          onClick={onClose}
        >
          Cancelar
        </button>

      </div>
    </div>
  );
}



