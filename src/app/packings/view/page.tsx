// src/app/packings/view/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import BackButton from "@/components/BackButton";
import { secureFetch } from "@/lib/secureFetch";
import { getRole } from "@/lib/role";
import InvoiceSummary from "@/components/InvoiceSummary";

export default function PackingViewPage() {
  const role = getRole();
  const [invoice, setInvoice] = useState("");
  const [data, setData] = useState<any | null>(null);
  const [err, setErr] = useState("");

  // referencia al input
  const inputRef = useRef<HTMLInputElement>(null);

  // auto focus al cargar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const buscar = async () => {
    setErr("");
    setData(null);
    if (!invoice?.trim()) return;

    try {
      const r = await secureFetch(`/api/packings/by-invoice/${invoice}`);
      const res = await r.json();

      if (!r.ok || !res.ok) {
        setErr(res?.error || "No encontrado");
      } else {
        setData(res.packing);
      }
    } catch {
      setErr("Error al buscar");
    }
  };

  return (
    <main className="p-8 max-w-4xl mx-auto space-y-6">
      <BackButton />

      <h1 className="text-4xl font-bold">
        {role === "facturacion"
          ? "Factura — Trámite Aduanal"
          : "Packing — Read only"}
      </h1>

      <div className="flex gap-3">
        <input
  ref={inputRef}
  className="border px-3 py-2 rounded w-40"
  value={invoice}
  onChange={(e) => setInvoice(e.target.value.toUpperCase())}
  onKeyDown={(e) => {
    if (e.key === "Enter") buscar();
  }}
  placeholder="Número de factura"
/>
        <button className="px-3 py-2 border rounded" onClick={buscar}>
          Buscar
        </button>
      </div>

      {err && <p className="text-red-600">{err}</p>}

      {data && <InvoiceSummary packing={data} />}
    </main>
  );
}