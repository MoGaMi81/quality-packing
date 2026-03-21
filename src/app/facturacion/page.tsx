"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRoleSafe } from "@/lib/session"; // ✅ reemplazo correcto

export default function FacturacionHome() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const role = getRoleSafe(); // ✅ reemplazo en lectura
    if (!role) return;

    if (role !== "facturacion" && role !== "admin") {
      router.replace("/");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.replace("/login");
  }

  if (!authorized) {
    return <div>Cargando...</div>;
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