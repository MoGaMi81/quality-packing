"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRoleSafe } from "@/lib/session";
import RoleGuard from "@/components/RoleGuard";
import HomeDashboard from "@/components/HomeDashboard";

export default function FacturacionHome() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const r = getRoleSafe();
    setRole(r);
  }, []);

  if (!role) return <div className="p-6">Cargando sesión...</div>;

  if (role !== "facturacion" && role !== "admin") {
    router.replace("/");
    return null;
  }

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

  return (
    <RoleGuard allow={["facturacion", "admin"]}>
      <HomeDashboard
        title="Facturación"
        subtitle="Facturar packings pendientes o consultar facturas ya emitidas"
        onLogout={logout}
        actions={[
          {
            title: "Facturar packing",
            description: "Asignar factura y guía a packings pendientes",
            onClick: () => router.push("/facturacion/pending"),
          },
          {
            title: "Buscar factura",
            description: "Consultar facturas ya emitidas",
            onClick: () => router.push("/facturacion/buscar"),
          },
        ]}
      />
    </RoleGuard>
  );
}