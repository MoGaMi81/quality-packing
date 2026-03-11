"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/role";

function getStatusBadge(status: string, pricing_status: string) {
  if (status === "READY" && pricing_status === "PENDING") {
    return { label: "READY FOR PRICING", color: "bg-yellow-200 text-yellow-800" };
  }

  if (status === "READY" && pricing_status === "DONE") {
    return { label: "PRICED", color: "bg-blue-200 text-blue-800" };
  }

  if (status === "COMPLETED") {
    return { label: "EXPORTED", color: "bg-green-200 text-green-800" };
  }

  return { label: status, color: "bg-gray-200 text-gray-800" };
}

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const role = getRole();

    if (!role) return;

    if (role !== "admin") {
      router.replace("/");
    }
  }, [router]);

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
          title="Poner Precios"
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