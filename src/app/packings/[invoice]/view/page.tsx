// src/app/packings/[invoice]/view/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchJSON } from "@/lib/fetchJSON";

type Line = {
  box_no: number;
  code?: string;
  description_en: string;
  form: string;
  size: string;
  pounds: number;
  scientific_name?: string;
};

type PackingHeader = {
  invoice_no: string;
  client_code: string;
  client_name: string;
  address?: string;
  date?: string;
};

export default function PackingReadOnly({ params }: { params: { invoice: string } }) {
  const invoice = decodeURIComponent(params.invoice).toUpperCase();

  const [header, setHeader] = useState<PackingHeader | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJSON<{
          ok: boolean;
          packing: PackingHeader;
          lines: Line[];
        }>(`/api/packings/by-invoice/${invoice}`);

        if (!data.ok) {
          alert("Packing no encontrado.");
          return;
        }

        setHeader(data.packing);
        setLines(data.lines ?? []);
      } catch (e: any) {
        alert(e.message);
      }
      setLoading(false);
    })();
  }, [invoice]);

  if (loading) return <main className="p-6">Cargando…</main>;

  if (!header)
    return (
      <main className="p-6 text-red-600">
        No se encontró información de la factura {invoice}
      </main>
    );

  return (
    <main className="p-6 space-y-4">
      <div className="flex gap-2">
        <Link href="/" className="px-3 py-1 border rounded">
          ← Inicio
        </Link>
        <a href="/api/auth/logout" className="px-3 py-1 border rounded">
          Cerrar sesión
        </a>
      </div>

      <h1 className="text-2xl font-bold">
        Packing {header.invoice_no} — Read only
      </h1>

      <p className="text-sm">
        <b>Cliente:</b> {header.client_code} — {header.client_name} &nbsp;&nbsp;
        <b>Fecha:</b> {header.date}
      </p>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Box</th>
            <th className="border px-2 py-1">Producto</th>
            <th className="border px-2 py-1">Form</th>
            <th className="border px-2 py-1">Size</th>
            <th className="border px-2 py-1">Lbs</th>
          </tr>
        </thead>

        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td className="border px-2 py-1">{l.box_no}</td>
              <td className="border px-2 py-1">{l.description_en}</td>
              <td className="border px-2 py-1">{l.form}</td>
              <td className="border px-2 py-1">{l.size}</td>
              <td className="border px-2 py-1 text-right">{l.pounds}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pt-2">
        <a
          className="inline-block px-3 py-2 rounded border"
          href={`/api/export/excel?invoice=${invoice}`}
        >
          Exportar a Excel
        </a>
      </div>
    </main>
  );
}
