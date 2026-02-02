"use client";

import { useRouter } from "next/navigation";

export default function AdminHeader() {
  const router = useRouter();

  function logout() {
    // ajusta si usas otra ruta
    document.cookie =
      "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    router.replace("/login");
  }

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div
          className="font-bold text-xl cursor-pointer"
          onClick={() => router.push("/admin")}
        >
          Quality Packing
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-3 py-1 border rounded"
          >
            ← Volver
          </button>

          <button
            onClick={logout}
            className="px-3 py-1 bg-black text-white rounded"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
