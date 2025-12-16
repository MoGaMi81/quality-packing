// src/app/packings/[invoice]/invoice/page.tsx
"use client";

import { AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";
import { getRole } from "@/lib/role";
import InvoiceMenuModal from "@/components/InvoiceMenuModal";
import { buildInvoiceSummary, buildSeaLionPacking } from "@/domain/packing/invoice-builders";
import type { PackingLine } from "@/domain/packing/types";

export default function InvoicePage({ params }: { params: { invoice: string } }) {
  const invoice = params.invoice.toUpperCase();
  const role = getRole();

  const [packing, setPacking] = useState<any | null>(null);
  const [pricing, setPricing] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(false);

  const [err, setErr] = useState<string | null>(null);

  // -----------------------------------------
  // CARGAR PACKING + PRICING DESDE SUPABASE
  // -----------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchJSON(`/api/packings/by-invoice/${invoice}`);
        if (!res.packing) {
          setErr("Packing no encontrado");
          return;
        }

        setPacking(res.packing);

        // cargar precios guardados
        const saved = await fetchJSON(`/api/packings/pricing/${invoice}`);
        if (saved?.lines) {
          setPricing(saved.lines);
        }
      } catch (e: any) {
        setErr(e.message || "Error cargando datos.");
      }
      setLoading(false);
    })();
  }, [invoice]);

  if (loading) return <main className="p-6">Cargando…</main>;
  if (err) return <main className="p-6 text-red-600">{err}</main>;
  if (!packing) return null;

  const lines: PackingLine[] = packing.lines;
  const client = packing.header.client_name.trim().toUpperCase();
  const isSeaLion = client.includes("SEA LION");

  // -----------------------------------------
  // 1) FORMATO PACKING (solo para mostrar arriba)
  // -----------------------------------------
  let packingView: any[] = [];

  if (isSeaLion) {
    packingView = buildSeaLionPacking(lines); // sin rangos, sin MX
  } else {
    packingView = lines; // packing normal
  }

  // -----------------------------------------
  // 2) FORMATO FACTURA (RESUMEN)
  // -----------------------------------------
  const invoiceSummary = buildInvoiceSummary(lines, pricing);

  const totalLbs = invoiceSummary.reduce((s: any, r: { pounds: any; }) => s + r.pounds, 0);
  const totalUsd = invoiceSummary.reduce((s: any, r: { total: any; }) => s + r.total, 0);

  const missingPrices = invoiceSummary.some((r: { price: number; }) => r.price <= 0);

  // -----------------------------------------
  // RENDER
  // -----------------------------------------
  return (
    <main className="p-8 max-w-5xl mx-auto space-y-8">

      {/* ENCABEZADO */}
      <div className="flex justify-between items-center">
        <a href="/" className="underline">← Inicio</a>

        {role === "facturacion" ? (
          <span className="text-lg font-bold text-blue-700">
            Facturación – Trámite Aduanal
          </span>
        ) : (
          <button
            className="px-4 py-2 rounded bg-black text-white"
            onClick={() => setOpenMenu(true)}
          >
            Opciones
          </button>
        )}
      </div>

      {/* TÍTULO */}
      <h1 className="text-3xl font-bold">
        FACTURA — {invoice}
      </h1>

      <div>
        <b>Cliente:</b> {packing.header.client_name}<br />
        <b>Fecha:</b> {packing.header.date}<br />
        <b>AWB:</b> {packing.header.guide}
      </div>

      {/* TABLA DE RESUMEN */}
      <section className="p-4 bg-white rounded-xl shadow">
        <h2 className="text-lg font-semibold mb-2">Resumen</h2>

        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Item</th>
              <th className="p-2 border">Size</th>
              <th className="p-2 border">Boxes</th>
              <th className="p-2 border">Lbs</th>
              <th className="p-2 border">Price</th>
              <th className="p-2 border">Total</th>
            </tr>
          </thead>

          <tbody>
            {invoiceSummary.map((r: { description_en: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; size: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; boxes: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; pounds: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; price: number; total: number; }, i: Key | null | undefined) => (
              <tr key={i}>
                <td className="border p-2">{r.description_en}</td>
                <td className="border p-2">{r.size}</td>
                <td className="border p-2 text-center">{r.boxes}</td>
                <td className="border p-2 text-right">{r.pounds}</td>
                <td className="border p-2 text-right">{r.price.toFixed(2)}</td>
                <td className="border p-2 text-right">{r.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>

          <tfoot className="bg-gray-50">
            <tr>
              <td className="border p-2 font-bold" colSpan={3}>
                TOTAL
              </td>
              <td className="border p-2 text-right font-bold">{totalLbs}</td>
              <td className="border p-2"></td>
              <td className="border p-2 text-right font-bold">
                {totalUsd.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      {/* MODAL */}
      <InvoiceMenuModal
        open={openMenu}
        onClose={() => setOpenMenu(false)}
        invoice={invoice}
        hasPrices={!missingPrices}
      />
    </main>
  );
}
