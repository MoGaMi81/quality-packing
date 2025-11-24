//src/app/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [role, setRole] = useState<string>("loading");

  useEffect(() => {
    const r = document.head.querySelector("meta[name='x-user-role']")?.getAttribute("content");
    if (!r) {
      window.location.href = "/login";
      return;
    }
    setRole(r);

    if (r === "proceso") window.location.href = "/packing";
    if (r === "facturacion") window.location.href = "/packing/view";
  }, []);

  if (role === "loading") return <div style={{ padding: 24 }}>Cargando…</div>;

  if (role !== "admin") return <div style={{ padding: 24 }}>Redirigiendo…</div>;

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
