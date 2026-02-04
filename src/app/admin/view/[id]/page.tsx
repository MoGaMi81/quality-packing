"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchJSON } from "@/lib/fetchJSON";

export default function ViewPacking() {
  const { id } = useParams();
  const router = useRouter();
  const [packing, setPacking] = useState<any>(null);

  useEffect(() => {
    fetchJSON(`/api/packings/${id}`, { cache: "no-store" })
      .then(res => {
        if (!res?.ok) throw new Error();
        setPacking(res.packing);
      })
      .catch(() => router.replace("/admin/view"));
  }, [id, router]);

  if (!packing) return <div className="p-6">Cargando…</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="mb-4">
        ← Volver
      </button>

      <h1 className="text-2xl font-bold mb-4">
        Factura: {packing.invoice_no}
      </h1>

      {/* header + líneas + totales (read only) */}
    </div>
  );
}
