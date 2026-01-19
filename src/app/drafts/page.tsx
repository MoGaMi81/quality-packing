"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/role";

type Role = "admin" | "proceso" | "facturacion";

type Draft = {
  id: string;
  client_code: string;
  internal_ref: string;
  status: string;
  created_at: string;
};

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const role = getRole() as Role;

  // 🔄 Cargar listado de drafts
  async function load() {
    try {
      const r = await fetch("/api/packing-drafts/list", {
        cache: "no-store",
      });
      const data = await r.json();

      if (data.ok) setDrafts(data.drafts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // 🔑 Logout
  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  }

  // 🗑️ Eliminar draft
  async function deleteDraft(id: string) {
    if (!confirm("¿Eliminar este draft? Esta acción no se puede deshacer.")) {
      return;
    }

    const r = await fetch(`/api/packing-drafts/${id}/delete`, {
      method: "DELETE",
    });
    const data = await r.json();

    if (!r.ok || !data.ok) {
      alert(data?.error || "No se pudo eliminar");
      return;
    }

    // Recargar listado
    load();
  }

  // ✅ Finalizar draft con confirmación y PATCH
  async function finalizeDraft(id: string) {
    if (!confirm("¿Confirmas que deseas finalizar esta etapa?")) return;

    const r = await fetch(`/api/packing-drafts/${id}/finalize`, {
      method: "PATCH",
    });
    const data = await r.json();

    if (!r.ok || !data.ok) {
      alert(data?.error || "No se pudo finalizar");
      return;
    }

    // refrescar lista
    load();
  }

  // 🔑 Etiquetas dinámicas para finalizar según rol
  const finalizeLabelByRole: Record<Role, string> = {
    proceso: "Finalizar (enviar a facturación)",
    facturacion: "Finalizar (enviar a admin)",
    admin: "Cerrar proceso",
  };

  if (loading) return <p className="p-6">Cargando borradores...</p>;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.replace("/")}
          className="px-3 py-1 border rounded"
        >
          ← Inicio
        </button>

        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold">Drafts</h1>
          <p className="text-sm text-gray-500">
            {role === "proceso" && "Borradores en proceso"}
            {role === "facturacion" && "Pendientes de facturación"}
            {role === "admin" && "Listos para pricing"}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/drafts/new"
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
          >
            Nuevo Draft
          </Link>

          <button
            onClick={logout}
            className="px-3 py-2 border rounded text-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* LISTA DE DRAFTS */}
      <div className="space-y-3">
        {drafts.map((d) => (
          <div
            key={d.id}
            className="border bg-white rounded-lg p-4 shadow-sm flex justify-between items-center"
          >
            <div>
              <div className="text-lg font-semibold">
                {d.client_code} · {d.internal_ref}
              </div>
              <div className="text-sm text-gray-500">
                Estado: {d.status} ·{" "}
                {new Date(d.created_at).toLocaleString()}
              </div>
            </div>

            <div className="flex gap-2">
              {(role === "admin" || role === "proceso") && (
                <Link href={`/drafts/${d.id}`}>Editar</Link>
              )}

              {role === "admin" && (
                <Link
                  href={`/api/export/draft?id=${d.id}`}
                  className="px-3 py-1 rounded bg-gray-800 text-white"
                >
                  Exportar
                </Link>
              )}

              {/* Botón Finalizar dinámico según rol */}
              {(role === "admin" || role === "facturacion" || role === "proceso") && (
                <button
                  onClick={() => finalizeDraft(d.id)}
                  className={`px-3 py-1 rounded text-white ${
                    role === "proceso"
                      ? "bg-blue-600"
                      : role === "facturacion"
                      ? "bg-orange-500"
                      : "bg-green-700"
                  }`}
                >
                  {finalizeLabelByRole[role]}
                </button>
              )}

              {/* Botón Eliminar solo para proceso con status PROCESS */}
              {role === "proceso" && d.status === "PROCESS" && (
                <button
                  onClick={() => deleteDraft(d.id)}
                  className="px-3 py-1 rounded bg-red-600 text-white flex items-center gap-1"
                >
                  🗑️ Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}