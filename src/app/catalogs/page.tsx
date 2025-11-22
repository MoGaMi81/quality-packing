"use client";

import { loadCatalogs } from "@/lib/loadCatalogs";

export default function CatalogsPage() {
  const { clients, species, sizes, forms, settings } = loadCatalogs();

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Catalogs (Local)</h1>

      <section>
        <h2 className="text-xl font-semibold">Settings</h2>
        <div className="mt-2 rounded border p-3">
          <div>Invoice suffix: <b>{settings.invoice_suffix}</b></div>
          <div>Last invoice #: <b>{settings.last_invoice_number}</b></div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Clients ({clients.length})</h2>
        <ul className="list-disc pl-6">
          {clients.map(c => (
            <li key={c.id}>
              <b>{c.code}</b> — {c.name} {c.tax_id ? `(TAX: ${c.tax_id})` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">Species ({species.length})</h2>
        <ul className="list-disc pl-6">
          {species.map(s => (
            <li key={s.id}>
              <b>{s.code}</b> — {s.name_en} {s.scientific_name ? `(${s.scientific_name})` : ""} {s.form_default ? `· default: ${s.form_default}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold">Sizes ({sizes.length})</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map(sz => (
              <span key={sz.id} className="rounded border px-2 py-1 text-sm">{sz.name}</span>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Forms ({forms.length})</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {forms.map(f => (
              <span key={f.id} className="rounded border px-2 py-1 text-sm">{f.name}</span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
