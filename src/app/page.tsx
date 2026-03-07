"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (!role) {
      router.replace("/login");
      return;
    }

    switch (role) {
      case "admin":
        router.replace("/admin");
        break;

      case "proceso":
        router.replace("/drafts");
        break;

      case "facturacion":
        router.replace("/facturacion");
        break;

      default:
        router.replace("/login");
    }
  }, [router]);

  return <div style={{ padding: 24 }}>Redirigiendo…</div>;
}