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

/* ================= FILTER ================= */
function filterDraftsByRole(drafts: Draft[], role: Role) {
  if (!role) return [];

  if (role === "proceso") {
    return drafts.filter((d) => d.status === "PROCESS");
  }

  if (role === "facturacion") {
    return drafts.filter((d) => d.status === "TO_BILLING");
  }

  if (role === "admin") {
    return drafts.filter((d) => d.status === "TO_ADMIN");
  }

  return [];
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const role = getRole() as Role;

  /* ================= LOAD ================= */
  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/packing-drafts/list", {
        cache: "no-store",
      });
      const data = await r.json();

      if (data.ok) {
        setDrafts(data.drafts || []);
      } else {
        setDrafts([]);
      }
    } catch (e) {
      console.error(e);
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  /* ================= LOGOUT ================= */
  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.replace("/login");
  }

  /* ================= DELETE ================= */
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

    load();
  }

  /* ================= FINALIZE ================= */
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

    load(); // 🔑 desaparece de la lista
  }

  /* ================= LABELS ================= */
  const finalizeLabelByRole: Record<Role, string> = {
    proceso: "Finalizar → Facturación",
    facturacion: "Finalizar → Admin",
    admin: "Cerrar proceso",
  };

  const finalizeIconByRole: Record<Role, string> = {
    proceso: "📦",       // caja → proceso
    facturacion: "💰",   // dinero → facturación
    admin: "✅",         // check → admin
  };

  if (loading) {
    return <p className="p-6">Cargando borradores…</p>;
  }

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
          {role === "proceso" && (
            <Link
              href="/drafts/new"
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
            >
              Nuevo Draft
            </Link>
          )}

          <button
            onClick={logout}
            className="px-3 py-2 border rounded text-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* LISTA */}
      <div className="space-y-3">
        {filterDraftsByRole(drafts, role).length === 0 && (
          <div className="text-center text-gray-500 py-12">
            No hay drafts pendientes
          </div>
        )}

        {filterDraftsByRole(drafts, role).map((d) => (
          <div
            key={d.id}
            className="border bg-white rounded-lg p-4 shadow-sm flex justify-between items-center"
          >
            <div>
              <div className="text-lg font-semibold">
                {d.client_code} · {d.internal_ref}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(d.created_at).toLocaleString()}
              </div>
            </div>

            <div className="flex gap-2">
              {/* EDITAR */}
              {role === "proceso" && d.status === "PROCESS" && (
                <Link
                  href={`/drafts/${d.id}`}
                  className="px-3 py-1 border rounded"
                >
                  Editar
                </Link>
              )}

              {/* FINALIZAR con ícono según rol */}
              {role === "proceso" && d.status === "PROCESS" && (
                <button
                  onClick={() => finalizeDraft(d.id)}
                  className="px-3 py-1 rounded bg-blue-600 text-white flex items-center gap-1"
                >
                  {finalizeIconByRole[role]} {finalizeLabelByRole[role]}
                </button>
              )}
              {role === "facturacion" && d.status === "TO_BILLING" && (
                <button
                  onClick={() => finalizeDraft(d.id)}
                  className="px-3 py-1 rounded bg-orange-500 text-white flex items-center gap-1"
                >
                  {finalizeIconByRole[role]} {finalizeLabelByRole[role]}
                </button>
              )}
              {role === "admin" && d.status === "TO_ADMIN" && (
                <button
                  onClick={() => finalizeDraft(d.id)}
                  className="px-3 py-1 rounded bg-green-700 text-white flex items-center gap-1"
                >
                  {finalizeIconByRole[role]} {finalizeLabelByRole[role]}
                </button>
              )}

              {/* ELIMINAR */}
              {role === "proceso" && d.status === "PROCESS" && (
                <button
                  onClick={() => deleteDraft(d.id)}
                  className="px-3 py-1 rounded bg-red-600 text-white"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}