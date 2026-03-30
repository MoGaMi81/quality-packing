"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/hooks/useSession";

export default function RoleGuard({
  allow,
  children,
}: {
  allow: string[];
  children: React.ReactNode;
}) {
  const { role, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!role || !allow.includes(role)) {
      router.replace("/");
    }
  }, [role, loading, allow, router]);

  if (loading) {
    return <div className="p-6">Cargando sesión...</div>;
  }

  if (!role || !allow.includes(role)) {
    return <div className="p-6">Redirigiendo...</div>;
  }

  return <>{children}</>;
}