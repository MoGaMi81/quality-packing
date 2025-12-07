"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { catalogs } from "@/lib/loadCatalogs";

export default function NewDraftPage() {
  const [client, setClient] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();

  const submit = async () => {
    if (!client.trim()) {
      alert("Debes seleccionar un cliente.");
      return;
    }
    if (!name.trim()) {
      alert("Debes escribir un nombre para el draft.");
      return;
    }

    const r = await fetch("/api/drafts/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_code: client,
        draft_name: `${client} – ${name}`,
      }),
    });

    const data = await r.json();

    if (!data.ok) {
      alert(data.error || "Error al crear draft");
      return;
    }

    router.push(`/drafts/${data.id}`);
  };

  return (
    <main className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold text-center">Nuevo Draft</h1>

      {/* Cliente */}
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

      {/* Nombre del draft */}
      <div>
        <label className="block font-semibold mb-1">Nombre del Draft</label>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Pulpo, Heads, Express..."
          value={name}
          onChange={(e) => setName(e.target.value)}
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
