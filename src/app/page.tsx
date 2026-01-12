"use client";

import { useEffect, useState } from "react";
import { getRole } from "@/lib/role";

export default function Home() {
  const [role, setRole] = useState<null | string>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const r = getRole();
    setRole(r);
    setLoading(false);

    if (!r) return;

    if (r === "proceso") window.location.href = "/packings";
    if (r === "facturacion") window.location.href = "/packings/view";
  }, []);

  if (loading) {
    return <div style={{ padding: 24 }}>Cargando…</div>;
  }

  if (!role) {
    return (
      <div style={{ padding: 24 }}>
        Sign in. <a href="/login">Ir a login</a>
      </div>
    );
  }

  if (role !== "admin") {
    return <div style={{ padding: 24 }}>Redirigiendo…</div>;
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800 }}>Quality Packing — Admin</h1>
      <ul style={{ marginTop: 12, lineHeight: 1.9 }}>
        <li><a href="/packings">➤ Capturar packing</a></li>
        <li><a href="/packings/view">➤ Ver packings</a></li>
        <li><a href="/catalogs">➤ Catálogos</a></li>
        <li><a href="/drafts">➤ Drafts</a></li>   {/* NUEVO */}
      </ul>
    </main>
  );
}
