"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/role";

export default function Home() {
  const router = useRouter();

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

    // proceso y facturación
    router.replace("/drafts");
  }, [router]);

  return <div style={{ padding: 24 }}>Redirigiendo…</div>;
}
