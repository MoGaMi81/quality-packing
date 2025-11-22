// src/app/login/page.tsx
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
      body: JSON.stringify({ email, password }),
    });

    let data: any = {};
    try { data = await r.json(); } catch {}

    if (!r.ok || !data.ok) { 
      alert(data?.error || "Credenciales inválidas"); 
      return;
    }

    const role = String(data.user?.role || "").toLowerCase();
    console.log("LOGIN OK:", { role, user: data.user });

    // Redirección por rol
    if (role === "proceso") router.replace("/packing");
    else if (role === "facturacion") router.replace("/packing/view");
    else if (role === "admin") router.replace("/");         // dashboard admin
    else router.replace("/");                               // fallback
  };

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 48, fontWeight: 700, marginBottom: 24 }}>Sign in</h1>
      <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
        <input placeholder="email" value={email} onChange={(e)=>setEmail(e.target.value)} style={{ flex: 1, padding: 10 }}/>
        <input placeholder="password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} style={{ flex: 1, padding: 10 }}/>
        <button type="submit" style={{ padding: "10px 16px" }}>Entrar</button>
      </form>
    </main>
  );
}
