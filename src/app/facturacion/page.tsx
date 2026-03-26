"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRoleSafe } from "@/lib/session";

export default function FacturacionHome() {
  const router = useRouter();

  const [role, setRole] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);

  // 🔐 cargar sesión (UNA sola vez)
  useEffect(() => {
    const r = getRoleSafe();
    setRole(r);

    if (!r) return;

    if (r !== "facturacion" && r !== "admin") {
      router.replace("/");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  // ⏳ mientras carga sesión
  if (!role) {
    return <div>Cargando sesión...</div>;
  }

  // ⏳ validando acceso
  if (!authorized) {
    return <div>Cargando...</div>;
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.replace("/login");
  }

  return (
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
  );
}