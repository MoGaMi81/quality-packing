"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getRole } from "@/lib/role";


export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refresh = searchParams.get("refresh");

  const [pendingPricing, setPendingPricing] = useState(0);

  useEffect(() => {
    const role = getRole();

    if (!role) return;

    if (role !== "admin") {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    fetch("/api/admin/pricing/pending-count", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setPendingPricing(d.count ?? 0));
  }, [refresh]);

  const Card = ({
    title,
    desc,
    onClick,
  }: {
    title: string;
    desc: string;
    onClick: () => void;
  }) => (
    <div
      onClick={onClick}
      className="cursor-pointer border rounded-xl p-6 hover:bg-gray-50 transition"
    >
      <div className="text-xl font-semibold mb-2">{title}</div>
      <div className="text-gray-600">{desc}</div>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title={`Precio (${pendingPricing} pendientes)`}
          desc="Packings pendientes de precios"
          onClick={() => router.push("/admin/pricing")}
        />

        <Card
          title="Ver"
          desc="Consulta general de packings"
          onClick={() => router.push("/admin/view")}
        />
      </div>
    </div>
  );
}