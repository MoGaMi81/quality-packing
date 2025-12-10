"use client";
import { useState } from "react";

type Line = { box_no:number; description_en:string; form:string; size:string; pounds:number };
type Packing = {
  invoice_no: string;
  header: {
    client_code: string; client_name: string; address: string; tax_id: string;
    guide?: string; date?: string;
  };
  lines: Line[];
  status: "draft" | "final";
};

export default function PackingReadOnly() {
  const [invoice, setInvoice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [data, setData]     = useState<Packing | null>(null);

  const fetchInvoice = async () => {
    setError(null); setData(null);
    const inv = invoice.trim();
    if (!inv) { setError("Ingresa un número de factura."); return; }
    try {
      setLoading(true);
      const res = await fetch(`/api/packing/by-invoice?inv=${encodeURIComponent(inv)}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Error consultando factura");
      setData(j.packing);
    } catch (e:any) {
      setError(e.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const totalLbs   = data?.lines?.reduce((s, l) => s + (l.pounds||0), 0) ?? 0;
  const totalBoxes = data ? new Set(data.lines.map(l => l.box_no)).size : 0;

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">Packing — Read only</h1>

      {/* Buscador */}
      <section className="p-4 border rounded-xl space-y-3">
        <label className="block text-sm font-semibold">Buscar por número de factura</label>
        <div className="flex gap-2 items-center">
          <input
            className="border rounded px-3 py-2 w-60"
            placeholder="Ej. 1033 A"
            value={invoice}
            onChange={(e)=>setInvoice(e.target.value)}
            onKeyDown={(e)=>{ if(e.key==="Enter") fetchInvoice(); }}
          />
          <button className="px-4 py-2 rounded bg-black text-white" onClick={fetchInvoice} disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </section>

      {/* Resultado */}
      {data && (
        <section className="space-y-4">
          <div className="p-4 border rounded-xl">
            <div className="text-sm">
              <div><b>Client:</b> {data.header.client_name} ({data.header.client_code})</div>
              <div><b>Address:</b> {data.header.address}</div>
              <div><b>TAX:</b> {data.header.tax_id}</div>
              <div><b>Guide:</b> {data.header.guide || "-"}</div>
              <div><b>Invoice #:</b> {data.invoice_no}</div>
              <div><b>Date:</b> {data.header.date || "-"}</div>
              <div><b>Status:</b> {data.status}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border rounded">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Box No.</th>
                  <th className="p-2 border">Item Name/Producto</th>
                  <th className="p-2 border">FORM</th>
                  <th className="p-2 border">Size/Talla</th>
                  <th className="p-2 border">Box Weight (lbs)</th>
                </tr>
              </thead>
              <tbody>
                {data.lines.map((l, idx) => {
                  const prev = data.lines[idx - 1];
                  const cont = prev && prev.box_no === l.box_no;
                  return (
                    <tr key={idx}>
                      <td className="p-2 border">{cont ? "MX" : l.box_no}</td>
                      <td className="p-2 border">{l.description_en}</td>
                      <td className="p-2 border">{l.form}</td>
                      <td className="p-2 border">{l.size}</td>
                      <td className="p-2 border text-right">{l.pounds}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="p-2 border font-semibold">TOTAL BOXES</td>
                  <td className="p-2 border" colSpan={3}></td>
                  <td className="p-2 border text-right font-semibold">{totalBoxes}</td>
                </tr>
                <tr>
                  <td className="p-2 border font-semibold">TOTAL LBS</td>
                  <td className="p-2 border" colSpan={3}></td>
                  <td className="p-2 border text-right font-semibold">{totalLbs}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

