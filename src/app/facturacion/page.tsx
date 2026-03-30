"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRoleSafe } from "@/lib/session";
import RoleGuard from "@/components/RoleGuard";

export default function FacturacionHome() {
  const router = useRouter();

  const [role, setRole] = useState<string | null>(null);

  // 🔐 cargar sesión
  useEffect(() => {
    const r = getRoleSafe();
    console.log("ROLE DEBUG FACT:", r);
    setRole(r);
  }, []);

  // ⏳ esperando sesión
  if (!role) {
    return <div>Cargando sesión...</div>;
  }

  // 🚫 acceso inválido
  if (role !== "facturacion" && role !== "admin") {
    router.replace("/");
    return null;
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST",
      cache: "no-store",
      credentials: "include",
 });
    } catch {}
    router.replace("/login");
  }

  return (
    <RoleGuard allow={["facturacion", "admin"]}>
    <main className="max-w-xl mx-auto p-6 space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.replace("/")}
          className="px-3 py-1 border rounded"
        >
          ← Inicio
        </button>

        <h1 className="text-2xl font-bold">Facturación</h1>

        <button
          onClick={logout}
          className="px-3 py-1 border rounded text-sm bg-red-600 text-white"
        >
          Cerrar sesión
        </button>
      </div>

      {/* ACCIONES */}
      <div className="grid gap-4">
        <button
          onClick={() => router.push("/facturacion/pending")}
          className="w-full py-4 bg-blue-700 text-white rounded-xl text-lg font-semibold"
        >
          Facturar packing
        </button>

        <button
          onClick={() => router.push("/facturacion/buscar")}
          className="w-full py-4 bg-gray-800 text-white rounded-xl text-lg font-semibold"
        >
          Buscar factura
        </button>
      </div>

      {/* AYUDA */}
      <div className="text-sm text-gray-500 text-center">
        Facturar packings pendientes o consultar facturas ya emitidas
      </div>
    </main>
    </RoleGuard>
  );
}