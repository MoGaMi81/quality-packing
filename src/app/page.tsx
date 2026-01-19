"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/role";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const role = getRole();

    // Sin sesión → login
    if (!role) {
      router.replace("/login");
      return;
    }

    // Todos los roles entran por Drafts
    router.replace("/drafts");
  }, [router]);

  return (
    <div style={{ padding: 24 }}>
      Redirigiendo…
    </div>
  );
}
