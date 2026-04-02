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
  <div className="relative min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">

    {/* 🔷 LOGO */}
    <div className="absolute top-6 left-6">
      <img
        src="/logo.png"
        alt="Logo"
        className="h-20 md:h-24"
      />
    </div>

    {/* 🔷 CONTENEDOR CENTRADO */}
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">

        {/* 🔹 TÍTULO */}
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Sign in
        </h1>

        {/* 🔹 FORM */}
        <form onSubmit={submit} className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
<p className="text-sm text-gray-500 text-center">
  Acceso al sistema Quality Packing
</p>

            Entrar
          </button>
        </form>

      </div>
    </div>
  </div>
);
}
