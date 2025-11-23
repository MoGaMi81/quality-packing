"use client";

import { useEffect, useState } from "react";
import { usePackingStore } from "@/store/packingStore";
import { fetchJSON } from "@/lib/fetchJSON";
import type { PackingHeader } from "@/domain/packing/types";
import { getRole, can } from "@/lib/role";

type Props = { open: boolean; onClose: () => void };

export default function NewPackingWizard({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<"proceso"|"facturacion"|"admin"|null>(null);

  useEffect(() => {
    setMounted(true);
    setRole(getRole());   // 🔥 SOLO EN CLIENTE
  }, []);

  const { setHeader } = usePackingStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [clientCode, setClientCode] = useState("");
  const [clientResolved, setClientResolved] = useState<any | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [guide, setGuide] = useState("");

  if (!mounted || !open || !role) return null;


  // -------------------------------------------------
  // 1. Verificar Invoice
  // -------------------------------------------------
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

      const opt = prompt(`Invoice ${v} ya existe.\nOpciones: view, edit, pricing, export`, "view");
      if (!opt) return;

      const cmd = opt.toLowerCase();
      if (cmd === "view") window.location.href = `/packing/${v}/view`;
      if (cmd === "edit") window.location.href = `/packing/${v}/edit`;
      if (cmd === "pricing") window.location.href = `/packing/${v}/pricing`;
      if (cmd === "export") window.location.href = `/api/export/excel?invoice=${v}`;

      return;
    }

    setStep(2);
  };

  // -------------------------------------------------
  // 2. Resolver Cliente
  // -------------------------------------------------
  const resolveClient = async () => {
    const code = clientCode.trim().toUpperCase();
    if (!code) return;

    try {
      const c = await fetchJSON(`/api/catalogs/client/${encodeURIComponent(code)}`);
      setClientResolved(c);
      setStep(3);
    } catch {
      if (!can.startPacking(role)) {
        alert("Cliente no existe y tu rol no puede crearlo.");
        return;
      }

      const go = confirm(`Cliente ${code} no existe.\n¿Crear ahora?`);
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

  // -------------------------------------------------
  // 3. Finalizar Wizard
  // -------------------------------------------------
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

    setHeader(h); // NO clear()
    onClose();
    alert("Packing iniciado → ahora agrega cajas.");
  };

  // -------------------------------------------------
  // UI
  // -------------------------------------------------
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white p-5 rounded-xl w-full max-w-md space-y-5">
        <h2 className="text-xl font-bold">Nuevo Packing</h2>

        {/* Paso 1: Invoice */}
        {step === 1 && (
          <div className="space-y-3">
            <label>Factura / Invoice</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkInvoice()}
            />

            <div className="flex justify-end gap-2">
              <button className="border px-3 py-1 rounded" onClick={onClose}>Cancelar</button>
              <button className="px-3 py-1 bg-black text-white rounded" onClick={checkInvoice}>
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Paso 2: Cliente */}
        {step === 2 && (
          <div className="space-y-3">
            <label>Cliente / Código</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={clientCode}
              onChange={(e) => setClientCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && resolveClient()}
            />

            <div className="flex justify-end gap-2">
              <button className="border px-3 py-1 rounded" onClick={() => setStep(1)}>Atrás</button>
              <button className="px-3 py-1 bg-black text-white rounded" onClick={resolveClient}>Resolver</button>
            </div>
          </div>
        )}

        {/* Paso 3: Fecha + AWB */}
        {step === 3 && clientResolved && (
          <div className="space-y-3">
            <div className="text-sm">
              <b>{clientResolved.name}</b><br />
              {clientResolved.address}<br />
              TAX: {clientResolved.tax_id}
            </div>

            <label>Fecha</label>
            <input
              type="date"
              className="border rounded px-3 py-2 w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <label>AWB / Guía</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={guide}
              onChange={(e) => setGuide(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button className="border px-3 py-1 rounded" onClick={() => setStep(2)}>Atrás</button>
              <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={finishWizard}>
                Iniciar Packing
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


