// src/app/packings/view/page.tsx
"use client";
import { useState } from "react";
import { fetchJSON } from "@/lib/fetchJSON";

export default function ViewPacking() {
  const [invoice, setInvoice] = useState("");
  const [p, setP] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const buscar = async () => {
    setErr(null); setP(null);
    if (!invoice.trim()) return;
    try {
      const res = await fetchJSON(`/api/packings/by-invoice/${encodeURIComponent(invoice.trim())}`);
      setP(res?.packing ?? null);
      if (!res?.packing) setErr("No encontrado.");
    } catch (e:any) {
      setErr(e?.message ?? "Error buscando.");
    }
  };

  return (
    <main className="p-6 space-y-4">
      <a href="/" className="inline-block mb-2 px-3 py-1 border rounded">← Inicio</a>
      <h1 className="text-3xl font-bold">Packing — Read only</h1>

      <div className="flex gap-2 items-center">
        <input className="border rounded px-2 py-1" placeholder="Factura #:" value={invoice} onChange={e=>setInvoice(e.target.value)} />
        <button className="px-3 py-1 rounded border" onClick={buscar}>Buscar</button>
      </div>

      {err && <div className="text-red-600">{err}</div>}
      {p && (
        <>
          <div className="text-sm mt-2">
            <b>{p.header.client_name}</b> — Invoice {p.header.invoice_no} — {p.header.date}
          </div>
          <table className="min-w-full border mt-3">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Box</th>
                <th className="p-2 border">Item</th>
                <th className="p-2 border">Form</th>
                <th className="p-2 border">Size</th>
                <th className="p-2 border">Lbs</th>
              </tr>
            </thead>
            <tbody>
              {p.lines.map((l:any,i:number)=>(
                <tr key={i}>
                  <td className="p-2 border">{l.box_no}</td>
                  <td className="p-2 border">{l.description_en}</td>
                  <td className="p-2 border">{l.form}</td>
                  <td className="p-2 border">{l.size}</td>
                  <td className="p-2 border text-right">{l.pounds}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
