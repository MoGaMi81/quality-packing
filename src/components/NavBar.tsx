"use client";
import { useRouter } from "next/navigation";

export default function NavBar() {
  const r = useRouter();
  return (
    <div className="w-full flex items-center gap-2 py-2 border-b mb-4">
      <button
        className="px-3 py-1 border rounded"
        onClick={() => r.back()}
        title="Volver a la página anterior"
      >
        ← Atrás
      </button>
      <button
        className="px-3 py-1 border rounded"
        onClick={() => r.push("/")}
        title="Ir al inicio"
      >
        ⌂ Inicio
      </button>
    </div>
  );
}
