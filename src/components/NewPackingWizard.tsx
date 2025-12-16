"use client";

import { useState, useEffect } from "react";
import { fetchJSON } from "@/lib/fetchJSON";
import ExistingInvoiceModal from "@/components/ExistingInvoiceModal";
import { usePackingStore } from "@/store/packingStore";
import { getRole } from "@/lib/role";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function NewPackingWizard({ open, onClose }: Props) {
  const role = getRole();
  const { setHeader, clear } = usePackingStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [clientCode, setClientCode] = useState("");
  const [existingOpen, setExistingOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset cuando se abre
  useEffect(() => {
    if (open) {
      clear();
      setStep(1);
      setInvoiceNo("");
      setClientCode("");
    }
  }, [open]);

  if (!open) return null;

  // ============================================================
  // PASO 1 — Validar factura
  // ============================================================
  const goStep2 = async () => {
    const inv = invoiceNo.trim().toUpperCase();
    if (!inv) return alert("Ingresa un número de factura");

    setLoading(true);
    const res = await fetchJSON(`/api/packings/by-invoice/${inv}`);
    setLoading(false);

    if (res.packing) {
      // FACTURA YA EXISTE → Revisar rol
      if (role === "facturacion") {
        window.location.href = `/packings/${inv}/invoice`;
        return;
      }

      if (role === "proceso") {
        window.location.href = `/packings/${inv}/edit`;
        return;
      }

      // admin → mostrar menú
      setExistingOpen(true);
      return;
    }

    // Factura nueva → continuar
    setStep(2);
  };

  // ============================================================
  // PASO 2 — Validar cliente
  // ============================================================
  const goStep3 = async () => {
    if (!clientCode.trim()) return alert("Ingresa cliente");

    try {
      const r = await fetchJSON(`/api/catalogs/client/${clientCode.trim()}`);

      setHeader({
        invoice_no: invoiceNo.trim().toUpperCase(),
        client_code: clientCode.trim().toUpperCase(),
        client_name: r.client.name,
        address: r.client.address || "",
        guide: "",
        date: new Date().toISOString().slice(0, 10),
      });

      setStep(3);
    } catch {
      alert("Cliente no encontrado");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-6">

        <h2 className="text-xl font-bold text-center">Paso {step} de 3</h2>

        {/* PASO 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <label>Factura</label>
            <input
              className="border rounded w-full px-2 py-1"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
            />

            <button
              onClick={goStep2}
              className="w-full py-2 bg-black text-white rounded"
            >
              {loading ? "Validando..." : "Continuar"}
            </button>
          </div>
        )}

        {/* PASO 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <label>Cliente</label>
            <input
              className="border rounded w-full px-2 py-1"
              value={clientCode}
              onChange={(e) => setClientCode(e.target.value)}
            />

            <button
              onClick={goStep3}
              className="w-full py-2 bg-black text-white rounded"
            >
              Continuar
            </button>
          </div>
        )}

        {/* PASO 3 */}
        {step === 3 && (
          <div className="text-center space-y-4">
            <p className="text-lg">Packing listo para capturar cajas.</p>

            <button
              onClick={() => window.location.href = `/packings/${invoiceNo}/edit`}
              className="w-full py-2 bg-green-600 text-white rounded"
            >
              Ir a capturar cajas
            </button>
          </div>
        )}

        <button onClick={onClose} className="w-full text-center text-red-500 underline">
          Cancelar
        </button>

      </div>

      {/* Modal para admin */}
      <ExistingInvoiceModal
        open={existingOpen}
        invoice={invoiceNo.trim().toUpperCase()}
        onClose={() => setExistingOpen(false)}
      />
    </div>
  );
}

