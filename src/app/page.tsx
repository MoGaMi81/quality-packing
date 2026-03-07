"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/role";

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

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
  }, [ready, router]);

  if (!ready) return null;

  return <div style={{ padding: 24 }}>Redirigiendo…</div>;
}