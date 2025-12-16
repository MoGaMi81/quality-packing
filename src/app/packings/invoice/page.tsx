// src/app/packings/invoice/page.tsx
"use client";

import { useState } from "react";
import { getRole } from "@/lib/role";

export default function InvoiceFinder() {
  const role = getRole();
  const [inv, setInv] = useState("");

  if (role !== "facturacion" && role !== "admin") {
    return <main className="p-6 text-red-600">Acceso denegado.</main>;
  }

  const go = () => {
    if (!inv.trim()) return;
    window.location.href = `/packings/${inv.trim().toUpperCase()}/invoice`;
  };

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">Consultar Factura</h1>

      <input
        className="border rounded w-full px-3 py-2"
        placeholder="Ej. 3A"
        value={inv}
        onChange={(e) => setInv(e.target.value)}
      />

      <button
        onClick={go}
        className="w-full py-2 bg-black text-white rounded"
      >
        Ver factura
      </button>
    </main>
  );
}
