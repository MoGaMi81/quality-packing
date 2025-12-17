"use client";

export default function InvoiceSummary({ packing }: { packing: any }) {
  const { client_name, client_code, date, invoice_no, lines } = packing;

  const totalBoxes = new Set(lines.map((l: any) => l.box_no)).size;
  const totalLbs = lines.reduce((s: number, l: any) => s + (l.pounds ?? 0), 0);

  // Agrupar por especie + talla
  const grouped: Record<string, { item: string; size: string; lbs: number }> =
    {};

  for (const l of lines) {
    const key = `${l.description_en}___${l.size}`;
    if (!grouped[key])
      grouped[key] = {
        item: l.description_en,
        size: l.size,
        lbs: 0,
      };

    grouped[key].lbs += l.pounds;
  }

  const summary = Object.values(grouped);

  return (
    <div className="space-y-8 mt-6">

      <div className="text-xl font-semibold">
        {client_name} — Invoice {invoice_no} — {date}
      </div>

      {/* Tabla principal */}
      <table className="w-full border">
        <thead className="bg-gray-100 text-sm">
          <tr>
            <th className="border px-2 py-1">Boxes</th>
            <th className="border px-2 py-1">Item</th>
            <th className="border px-2 py-1">Size</th>
            <th className="border px-2 py-1">Lbs</th>
          </tr>
        </thead>

        <tbody>
          {summary.map((s, i) => (
            <tr key={i}>
              <td className="border px-2 py-1"></td>
              <td className="border px-2 py-1">{s.item}</td>
              <td className="border px-2 py-1">{s.size}</td>
              <td className="border px-2 py-1 text-right">{s.lbs}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totales */}
      <div className="text-lg font-bold">
        TOTAL BOX: {totalBoxes} — TOTAL LBS: {totalLbs}
      </div>
    </div>
  );
}
