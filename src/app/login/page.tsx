"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    let data: any = {};
    try {
      data = await r.json();
    } catch {}

    if (!r.ok || !data.ok) {
      alert(data?.error || "Credenciales inválidas");
      return;
    }

    const role = data.user.role;

    const session = {
      user_id: data.user.id,
      role,
    };

    document.cookie = `qp_session=${encodeURIComponent(
      JSON.stringify(session)
    )}; path=/; SameSite=Lax`;

    router.refresh();

    if (role === "admin") {
      router.replace("/admin");
    } else if (role === "proceso") {
      router.replace("/drafts");
    } else if (role === "facturacion") {
      router.replace("/facturacion");
    } else {
      router.replace("/login");
    }
  };

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 48, fontWeight: 700, marginBottom: 24 }}>
        Sign in
      </h1>

      {/* Logo arriba del formulario */}
      <div className="flex items-center justify-between p-6">
  <img src="/logo.png" className="h-20" />
</div>

      <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ flex: 1, padding: 10 }}
        />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ flex: 1, padding: 10 }}
        />
        <button type="submit" style={{ padding: "10px 16px" }}>
          Entrar
        </button>
      </form>
    </main>
  );
}
