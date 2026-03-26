"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRoleSafe } from "@/lib/session";

export default function AdminPage() {
  const router = useRouter();

  const [role, setRole] = useState<string | null>(null);
  const [pendingPricing, setPendingPricing] = useState(0);

  // 🔐 cargar sesión
  useEffect(() => {
    const r = getRoleSafe();
    console.log("ROLE DEBUG ADMIN:", r);
    setRole(r);
  }, []);

  // ⏳ esperando sesión
  if (!role) {
    return <div className="p-6">Cargando sesión...</div>;
  }

  // 🚫 acceso inválido
  if (role !== "admin") {
    router.replace("/");
    return null;
  }

  // 📊 cargar datos SOLO si es admin
  useEffect(() => {
    if (role !== "admin") return;

    const load = async () => {
      const r = await fetch("/api/admin/pricing/pending-count", {
        cache: "no-store",
      });

      const d = await r.json();
      setPendingPricing(d.count ?? 0);
    };

    load();
  }, [role]);

  const Card = ({
    title,
    desc,
    onClick,
  }: {
    title: string;
    desc: string;
    onClick: () => void;
  }) => (
    <div
      onClick={onClick}
      className="cursor-pointer border rounded-xl p-6 hover:bg-gray-50 transition"
    >
      <div className="text-xl font-semibold mb-2">{title}</div>
      <div className="text-gray-600">{desc}</div>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          title={`Precio (${pendingPricing} pendientes)`}
          desc="Packings pendientes de precios"
          onClick={() => router.push("/admin/pricing")}
        />

        <Card
          title="Ver"
          desc="Consulta general de packings"
          onClick={() => router.push("/admin/view")}
        />

        <Card
          title="Usuarios"
          desc="Administrar usuarios del sistema"
          onClick={() => router.push("/admin/users")}
        />
      </div>
    </div>
  );
}