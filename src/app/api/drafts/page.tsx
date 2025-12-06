"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState("");
  const router = useRouter();

  const loadDrafts = async () => {
    setLoading(true);
    const r = await fetch("/api/drafts/list");
    const data = await r.json();
    if (data.ok) setDrafts(data.drafts);
    setLoading(false);
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const createDraft = async () => {
    const code = client.trim().toUpperCase();
    if (!code) return;

    const r = await fetch("/api/drafts/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_code: code }),
    });

    const data = await r.json();

    if (data.ok) {
      router.push(`/packing/draft/${data.id}`);
    } else {
      alert(data.error || "Error creating draft");
    }
  };

  return (
    <main className="p-6 space-y-6 max-w-3xl mx-auto">

      {/* Crear nuevo draft */}
      <section className="p-4 bg-white rounded-xl shadow">
        <h2 className="text-xl font-bold mb-3">Nuevo Draft</h2>

        <div className="flex gap-2">
          <input
            className="border rounded px-3 py-2 flex-1"
            placeholder="Código cliente, ej: SL"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />
          <button
            className="px-4 py-2 bg-black text-white rounded"
            onClick={createDraft}
          >
            Crear
          </button>
        </div>
      </section>

      {/* Listado */}
      <section className="p-4 bg-white rounded-xl shadow">
        <h2 className="text-xl font-bold mb-3">Drafts Activos</h2>

        {loading && <div>Cargando...</div>}

        {!loading && drafts.length === 0 && (
          <div className="text-gray-500">No hay drafts activos.</div>
        )}

        {!loading && drafts.length > 0 && (
          <div className="space-y-2">
            {drafts.map((d) => (
              <div
                key={d.id}
                className="p-3 border rounded-lg hover:bg-gray-50 flex justify-between items-center"
              >
                <div>
                  <div className="font-semibold">{d.client_code}</div>
                  <div className="text-xs text-gray-500">
                    Última actualización: {new Date(d.updated_at).toLocaleString()}
                  </div>
                </div>

                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={() => router.push(`/packing/draft/${d.id}`)}
                >
                  Abrir
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}
