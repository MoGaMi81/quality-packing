"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRoleSafe } from "@/lib/session";
import HomeDashboard from "@/components/HomeDashboard";

export default function AdminPage() {
  const router = useRouter();

  const [role, setRole] = useState<string | null>(null);
  const [pendingPricing, setPendingPricing] = useState<number | null>(null);

  useEffect(() => {
    const r = getRoleSafe();
    setRole(r);
  }, []);

  useEffect(() => {
    if (!role) return;

    if (role !== "admin") {
      router.replace("/");
    }
  }, [role, router]);

  useEffect(() => {
    if (role !== "admin") return;

    const load = async () => {
      try {
        const r = await fetch("/api/admin/pricing/pending-count", {
          cache: "no-store",
          credentials: "include",
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

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });
    } catch {}

    router.replace("/login");
  }

  if (!role) return <div className="p-6">Cargando sesión...</div>;
  if (role !== "admin") return <div className="p-6">Redirigiendo...</div>;
  if (pendingPricing === null) return <div className="p-6">Cargando datos...</div>;

  return (
    <HomeDashboard
      title="Admin"
      subtitle="Panel principal de administración Quality Packing"
      onLogout={logout}
      actions={[
        {
          title: "Precio",
          badge: pendingPricing,
          description: "Packings pendientes de precios",
          onClick: () => router.push("/admin/pricing"),
        },
        {
          title: "Ver",
          description: "Consulta general de packings",
          onClick: () => router.push("/admin/view"),
        },
        {
          title: "Usuarios",
          description: "Administrar usuarios del sistema",
          onClick: () => router.push("/admin/users"),
        },
      ]}
    />
  );
}