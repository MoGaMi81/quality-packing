"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { catalogs } from "@/lib/loadCatalogs";

export default function NewDraftPage() {
  const [client, setClient] = useState("");
  const [ref, setRef] = useState("");
  const router = useRouter();

  const submit = async () => {
    if (!client.trim()) {
      alert("Selecciona un cliente");
      return;
    }
    if (!ref.trim()) {
      alert("Escribe un identificador");
      return;
    }

    const r = await fetch("/api/packing-drafts/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        header: {
          client_code: client,
          internal_ref: ref,
        },
        lines: [],
        status: "PROCESS",
      }),
    });

    const data = await r.json();

    if (!r.ok || !data.ok) {
      alert(data?.error || "Error al crear draft");
      return;
    }

    router.replace(`/drafts/${data.draft_id}`);
  };

  return (
    <main className="max-w-lg mx-auto p-6 space-y-4">

      <div className="flex items-center gap-3">
        <button
          onClick={() => router.replace("/drafts")}
          className="px-3 py-1 border rounded"
        >
          ← Drafts
        </button>

        <h1 className="text-2xl font-bold">Nuevo Draft</h1>
      </div>

      <div>
        <label className="block font-semibold mb-1">Cliente</label>
        <select
          className="w-full border rounded px-3 py-2"
          value={client}
          onChange={(e) => setClient(e.target.value)}
        >
          <option value="">Seleccione...</option>
          {catalogs.clients.map((c: any) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-semibold mb-1">Identificador</label>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Estafeta, Aerounion..."
          value={ref}
          onChange={(e) => setRef(e.target.value)}
        />
      </div>

      <button
        className="w-full px-4 py-2 rounded bg-blue-600 text-white"
        onClick={submit}
      >
        Crear Draft
      </button>
    </main>
  );
}
