// src/components/ExistingInvoiceModal.tsx
"use client";

import { getRole } from "@/lib/role";

type Props = {
  open: boolean;
  invoice: string;
  onClose: () => void;
};

export default function ExistingInvoiceModal({ open, invoice, onClose }: Props) {
  const role = getRole();
  if (!open) return null;

  // Roles que NO deben ver este modal
  if (role === "facturacion") {
    window.location.href = `/packings/${invoice}/invoice`;
    return null;
  }

  if (role === "proceso") {
    window.location.href = `/packings/${invoice}/edit`;
    return null;
  }

  // ADMIN → Modal completo
  const go = (url: string) => {
    window.location.href = url;
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-5 shadow-xl">

        <h2 className="text-xl font-bold text-center">
          La factura {invoice} ya existe
        </h2>

        <div className="space-y-3">

          <button
            className="w-full py-2 rounded bg-black text-white"
            onClick={() => go(`/packings/${invoice}/edit`)}
          >
            Editar Packing
          </button>

          <button
            className="w-full py-2 rounded bg-blue-600 text-white"
            onClick={() => go(`/packings/${invoice}/pricing`)}
          >
            Capturar Pricing
          </button>

          <button
            className="w-full py-2 rounded bg-green-600 text-white"
            onClick={() => go(`/api/export/excel?invoice=${invoice}`)}
          >
            Exportar Excel
          </button>

        </div>

        <button
          onClick={onClose}
          className="w-full text-center text-red-500 underline"
        >
          Cerrar
        </button>

      </div>
    </div>
  );
}

