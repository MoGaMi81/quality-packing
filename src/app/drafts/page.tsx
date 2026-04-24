"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";
import { getRoleSafe } from "@/lib/session";

type Role = "admin" | "proceso" | "facturacion";

type Draft = {
  client_name: string;
  id: string;
  client_code: string;
  internal_ref: string;
  status: string;
  created_at: string;
};

export default function DraftsPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const r = getRoleSafe() as Role | null;
    setRole(r);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/packing-drafts/list", {
          cache: "no-store",
          credentials: "include",
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
    };

    load();
  }, []);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.replace("/login");
  }

  async function deleteDraft(id: string) {
    if (!confirm("¿Eliminar este draft?")) return;

    const r = await fetch(`/api/packing-drafts/${id}/delete`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await r.json();

    if (!r.ok || !data.ok) {
      alert(data?.error || "No se pudo eliminar");
      return;
    }

    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  const visibleDrafts = drafts.filter((d) => {
    if (role === "proceso") return d.status === "PROCESS";
    if (role === "facturacion") return d.status === "PROCESS_DONE";
    return false;
  });

  if (loading) {
    return <p className="p-6">Cargando borradores…</p>;
  }

  return (
    <RoleGuard allow={["proceso", "facturacion"]}>
      <main className="relative min-h-screen overflow-hidden">

        {/* 🔥 FONDO */}
        <div className="fixed inset-0 z-0">
          <img
            src="/images/fondo.png"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-white/75 backdrop-blur-sm" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto p-6 space-y-6">

          {/* HEADER */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.replace("/")}
              className="px-3 py-1 border rounded bg-white"
            >
              ← Inicio
            </button>

            <div className="text-center">
              <h1 className="text-3xl font-bold">Drafts</h1>
              <p className="text-sm text-gray-600">
                {role === "proceso"
                  ? "Drafts en proceso"
                  : "Pendientes de facturación"}
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
                className="px-3 py-2 border rounded text-sm bg-red-600 text-white"
              >
                Cerrar sesión
              </button>
            </div>
          </div>

          {/* LISTA */}
          <div className="space-y-4">
            {visibleDrafts.length === 0 && (
              <div className="text-center text-gray-600 py-12 bg-white/80 rounded-xl">
                No hay drafts pendientes
              </div>
            )}

            {visibleDrafts.map((d) => (
              <div
                key={d.id}
                className="bg-white/95 rounded-xl p-4 shadow-md flex justify-between items-center"
              >
                <div>
                  <div className="text-lg font-semibold">
                    {d.client_name ?? d.client_code} · {d.internal_ref}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(d.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  {role === "proceso" && d.status === "PROCESS" && (
                    <>
                      <Link
                        href={`/drafts/${d.id}`}
                        className="px-3 py-1 rounded border"
                      >
                        Editar
                      </Link>

                      <button
                        onClick={async () => {
                          if (
                            !confirm(
                              "¿Finalizar proceso y enviar a facturación?"
                            )
                          )
                            return;

                          const r = await fetch(
                            `/api/packing-drafts/${d.id}/finish-process`,
                            {
                              method: "PATCH",
                              credentials: "include",
                            }
                          );

                          const data = await r.json();

                          if (!r.ok || !data.ok) {
                            alert(data?.error || "No se pudo finalizar");
                            return;
                          }

                          setDrafts((prev) =>
                            prev.filter((x) => x.id !== d.id)
                          );
                        }}
                        className="px-3 py-1 rounded bg-blue-600 text-white"
                      >
                        Finalizar
                      </button>

                      <button
                        onClick={() => deleteDraft(d.id)}
                        className="px-3 py-1 rounded bg-red-600 text-white"
                      >
                        Eliminar
                      </button>
                    </>
                  )}

                  {role === "facturacion" &&
                    d.status === "PROCESS_DONE" && (
                      <Link
                        href={`/facturacion/${d.id}`}
                        className="px-4 py-1 rounded bg-orange-500 text-white"
                      >
                        Facturar
                      </Link>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </RoleGuard>
  );
}