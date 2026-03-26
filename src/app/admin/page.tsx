"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRoleSafe } from "@/lib/session";

export default function AdminPage() {
  const router = useRouter();

  const [role, setRole] = useState<string | null>(null);
  const [pendingPricing, setPendingPricing] = useState<number | null>(null);

  // 🔐 1. Cargar sesión
  useEffect(() => {
    const r = getRoleSafe();
    console.log("ROLE ADMIN:", r);
    setRole(r);
  }, []);

  // 🔁 2. Redirección SEGURA (solo aquí)
  useEffect(() => {
    if (!role) return;

    if (role !== "admin") {
      router.replace("/");
    }
  }, [role, router]);

  // 📊 3. Cargar datos SOLO si es admin
  useEffect(() => {
    if (role !== "admin") return;

    const load = async () => {
      try {
        const r = await fetch("/api/admin/pricing/pending-count", {
          cache: "no-store",
        });

        const d = await r.json();
        setPendingPricing(d.count ?? 0);
      } catch (e) {
        console.error("Error loading pricing:", e);
        setPendingPricing(0);
      }
    };

    load();
  }, [role]);

  // ⏳ 4. Estados controlados
  if (!role) {
    return <div className="p-6">Cargando sesión...</div>;
  }

  if (role !== "admin") {
    return <div className="p-6">Redirigiendo...</div>;
  }

  if (pendingPricing === null) {
    return <div className="p-6">Cargando datos...</div>;
  }

  // ✅ 5. UI segura
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          onClick={() => router.push("/admin/pricing")}
          className="cursor-pointer border rounded-xl p-6 hover:bg-gray-50"
        >
          <div className="text-xl font-semibold mb-2">
            Precio ({pendingPricing})
          </div>
          <div className="text-gray-600">
            Packings pendientes de precios
          </div>
        </div>

        <div
          onClick={() => router.push("/admin/view")}
          className="cursor-pointer border rounded-xl p-6 hover:bg-gray-50"
        >
          <div className="text-xl font-semibold mb-2">Ver</div>
          <div className="text-gray-600">
            Consulta general de packings
          </div>
        </div>

        <div
          onClick={() => router.push("/admin/users")}
          className="cursor-pointer border rounded-xl p-6 hover:bg-gray-50"
        >
          <div className="text-xl font-semibold mb-2">Usuarios</div>
          <div className="text-gray-600">
            Administrar usuarios del sistema
          </div>
        </div>
      </div>
    </div>
  );
}