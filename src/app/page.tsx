"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/role";

export default function Home() {
  const router = useRouter();
  const role = getRole();

if (role !== "admin") {
  router.replace("/inicio");
  return null;
}

  useEffect(() => {
    const role = getRole();

    if (!role) {
      router.replace("/login");
      return;
    }

    if (role === "admin") {
      router.replace("/admin");
      return;
    }

    if (role === "proceso") {
      router.replace("/drafts");
      return;
    }

    if (role === "facturacion") {
      router.replace("/facturacion");
      return;
    }
  }, [router]);

  return <div style={{ padding: 24 }}>Redirigiendo…</div>;
}
