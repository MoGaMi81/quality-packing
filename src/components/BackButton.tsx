"use client";

import { getRoleSafe } from "@/lib/session";

export default function BackButton() {
  const role = getRoleSafe();

  const goBack = () => {
    if (role === "facturacion") window.location.href = "/packings/view";
    else window.location.href = "/packings";
  };

  return (
    <button
      onClick={goBack}
      className="px-3 py-1 border rounded hover:bg-gray-100"
    >
      ← Regresar
    </button>
  );
}
