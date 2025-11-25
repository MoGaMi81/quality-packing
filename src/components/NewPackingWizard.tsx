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

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

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
        const go = confirm(`Invoice ${v} ya existe.\n¿Abrir en edición?`);
        if (go) window.location.href = `/packing/${v}/edit`;
        return;
      }

      if (role === "facturacion") {
        window.location.href = `/packing/${v}/view`;
        return;
      }

      const opt = prompt(
        `Invoice ${v} ya existe.\nOpciones: view, edit, pricing, export`,
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

    const h: PackingHeader = {
      client_code: clientResolved.code,
      client_name: clientResolved.name,
      address: clientResolved.address,
      tax_id: clientResolved.tax_id,
      guide,
      invoice_no: invoiceNo.trim().toUpperCase(),
      date,
    };

    setHeader(h);
    onClose();
    alert("Packing iniciado → ahora agrega cajas.");
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-xl shadow">
        <h2 className="text-xl font-bold mb-4">Nuevo Packing</h2>

        {step === 1 && (
          <>
            <label>Invoice:</label>
            <input
              className="border rounded px-2 py-1 w-full"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
            />

            <button
              className="bg-black text-white px-4 py-2 rounded mt-4"
              onClick={checkInvoice}
            >
              Continuar
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <label>Cliente código:</label>
            <input
              className="border rounded px-2 py-1 w-full"
              value={clientCode}
              onChange={(e) => setClientCode(e.target.value)}
            />

            <button
              className="bg-black text-white px-4 py-2 rounded mt-4"
              onClick={resolveClient}
            >
              Continuar
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <label>AWB / Guía:</label>
            <input
              className="border rounded px-2 py-1 w-full"
              value={guide}
              onChange={(e) => setGuide(e.target.value)}
            />

            <label className="mt-3">Fecha:</label>
            <input
              type="date"
              className="border rounded px-2 py-1 w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <button
              className="bg-green-600 text-white px-4 py-2 rounded mt-4"
              onClick={finishWizard}
            >
              Finalizar
            </button>
          </>
        )}
      </div>
    </div>
  );
}



