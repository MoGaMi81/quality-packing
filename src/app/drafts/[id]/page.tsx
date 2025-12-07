"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { catalogs } from "@/lib/loadCatalogs";
import { getRole } from "@/lib/role";
import { fetchJSON } from "@/lib/fetchJSON";

type DraftData = {
  id: string;
  client_code: string;
  draft_name: string;
  header: any;
  lines: any[];
};

export default function DraftEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const role = getRole() ?? "proceso";

  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<DraftData | null>(null);

  // Campos editables
  const [clientCode, setClientCode] = useState("");
  const [draftName, setDraftName] = useState("");

  // datos de packing
  const [header, setHeader] = useState<any>({
    guide: "",
    date: "",
  });

  const [lines, setLines] = useState<any[]>([]);

  // ============ CARGAR DRAFT ============
  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchJSON<DraftData>(`/api/drafts/get/${params.id}`);
        setDraft(data);
        setClientCode(data.client_code);
        setDraftName(data.draft_name);
        setHeader(data.header);
        setLines(data.lines);
      } catch (e: any) {
        alert("No se pudo cargar el draft");
      }
      setLoading(false);
    };
    load();
  }, [params.id]);

  // ============ GUARDAR DRAFT ============
  const saveDraft = async () => {
    try {
      const body = {
        id: draft?.id,
        client_code: clientCode,
        draft_name: draftName,
        header,
        lines,
      };

      const r = await fetch("/api/drafts/save", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error al guardar draft");

      alert("Draft guardado correctamente");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // ============ FINALIZAR (FACTURAR) ============
  const finalizeDraft = async () => {
    const invoice_no = prompt("Ingrese número de factura (ej. 123A):");
    if (!invoice_no) return;

    try {
      const body = { id: draft?.id, invoice_no };
      const r = await fetch("/api/drafts/finalize", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Error al finalizar");

      alert("Factura creada. Redirigiendo…");
      router.push(`/packing/${invoice_no}/edit`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // ============ EXPORTAR DRAFT (SOLO ADMIN) ============
  const exportDraft = () => {
    window.location.href = `/api/export/draft?id=${draft?.id}`;
  };

  if (loading) return <div className="p-4">Cargando…</div>;
  if (!draft) return <div className="p-4">No encontrado.</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Editar Draft</h1>

      {/* Selección de cliente */}
      <div>
        <label className="block font-semibold mb-1">Cliente</label>
        <select
          className="border rounded px-3 py-2"
          value={clientCode}
          onChange={(e) => setClientCode(e.target.value)}
        >
          <option value="">Seleccione…</option>
          {catalogs.clients.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Nombre Draft */}
      <div>
        <label className="block font-semibold mb-1">Nombre del Draft</label>
        <input
          className="border rounded px-3 py-2 w-full"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="Ej. Pedido Pulpo"
        />
      </div>

      {/* Header básico */}
      <div className="border p-3 rounded-lg">
        <h2 className="font-bold mb-2">Datos (provisorios)</h2>

        <label className="block mb-1 font-semibold">Guía</label>
        <input
          className="border rounded px-2 py-1 mb-2 w-full"
          value={header.guide || ""}
          onChange={(e) => setHeader({ ...header, guide: e.target.value })}
        />

        <label className="block mb-1 font-semibold">Fecha</label>
        <input
          type="date"
          className="border rounded px-2 py-1 w-full"
          value={header.date || ""}
          onChange={(e) => setHeader({ ...header, date: e.target.value })}
        />
      </div>

      {/* LÍNEAS */}
      <div>
        <h2 className="font-bold mb-2">Líneas del Draft</h2>

        {lines.map((ln, idx) => (
          <div key={idx} className="border p-2 rounded mb-2">
            <input
              className="border px-2 py-1 rounded mr-2"
              placeholder="Especie"
              value={ln.description_en || ""}
              onChange={(e) => {
                const copy = [...lines];
                copy[idx].description_en = e.target.value;
                setLines(copy);
              }}
            />

            <input
              className="border px-2 py-1 rounded mr-2"
              placeholder="Tamaño"
              value={ln.size || ""}
              onChange={(e) => {
                const copy = [...lines];
                copy[idx].size = e.target.value;
                setLines(copy);
              }}
            />

            <input
              className="border px-2 py-1 rounded mr-2"
              placeholder="Libras"
              type="number"
              value={ln.pounds}
              onChange={(e) => {
                const copy = [...lines];
                copy[idx].pounds = Number(e.target.value);
                setLines(copy);
              }}
            />
          </div>
        ))}

        <button
          className="mt-2 px-3 py-1 border rounded"
          onClick={() =>
            setLines([...lines, { description_en: "", size: "", pounds: 0 }])
          }
        >
          + Agregar Línea
        </button>
      </div>

      {/* BOTONES */}
      <div className="flex gap-3 pt-4">
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white"
          onClick={saveDraft}
        >
          Guardar Draft
        </button>

        <button
          className="px-4 py-2 rounded bg-green-600 text-white"
          onClick={finalizeDraft}
        >
          Finalizar y Facturar
        </button>

        {role === "admin" && (
          <button
            className="px-4 py-2 rounded bg-purple-600 text-white"
            onClick={exportDraft}
          >
            Descargar Draft (Excel)
          </button>
        )}
      </div>
    </div>
  );
}
