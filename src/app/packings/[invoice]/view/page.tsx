// src/app/packing/[invoice]/view/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchJSON } from "@/lib/fetchJSON";

type Line = { box_no: number; description_en: string; form: string; size: string; pounds: number };
type Header = { invoice: string; customer_code: string; customer_name: string; date: string };

export default function PackingReadOnly({ params }: { params: { invoice: string } }) {
  const [header, setHeader] = useState<Header | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const inv = decodeURIComponent(params.invoice);

  useEffect(() => {
    (async () => {
      const data = await fetchJSON<{ header: Header; lines: Line[] }>(
        `/api/packings/by-invoice?invoice=${encodeURIComponent(inv)}`
      );
      setHeader(data.header);
      setLines(data.lines ?? []);
    })().catch((e) => alert(e.message));
  }, [inv]);

  return (
    <main className="p-6 space-y-4">
      <div className="flex gap-2">
        <Link href="/" className="px-3 py-1 border rounded">
          &larr; Inicio
        </Link>
        <a href="/api/auth/logout" className="px-3 py-1 border rounded">
          Cerrar sesión
        </a>
      </div>

      {!header ? (
        <p>Cargando…</p>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Packing {header.invoice} — Read only</h1>
          <p className="text-sm">
            <b>Cliente:</b> {header.customer_code} — {header.customer_name} &nbsp;&nbsp;
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
              href={`/api/export/excel?invoice=${encodeURIComponent(inv)}`}
            >
              Exportar a Excel
            </a>
          </div>
        </>
      )}
    </main>
  );
}

