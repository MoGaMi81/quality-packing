//src/app/page.tsx
"use client";

export const dynamic = "force-dynamic"; // 🔥 evita prerender

import { useEffect, useState } from "react";
import { getRole } from "@/lib/role";

export default function Home() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const r = getRole();
    if (!r) {
      window.location.href = "/login";
      return;
    }

    setRole(r);

    if (r === "proceso") window.location.href = "/packing";
    if (r === "facturacion") window.location.href = "/packing/view";
  }, []);

  if (!role) return <div style={{ padding: 24 }}>Cargando…</div>;

  if (role !== "admin")
    return <div style={{ padding: 24 }}>Redirigiendo…</div>;

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800 }}>Quality Packing — Admin</h1>
      <ul style={{ marginTop: 12, lineHeight: 1.9 }}>
        <li><a href="/packing">➤ Capturar packing</a></li>
        <li><a href="/packing/view">➤ Ver packings</a></li>
        <li><a href="/catalogs">➤ Catálogos</a></li>
      </ul>
    </main>
  );
}
