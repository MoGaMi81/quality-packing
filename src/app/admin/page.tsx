"use client";

import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();

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
          title="Pricing"
          desc="Packings pendientes de precios"
          onClick={() => router.push("/admin/pricing")}
        />

        <Card
          title="Exportar"
          desc="Packings listos para exportación"
          onClick={() => router.push("/admin/export")}
        />

        <Card
          title="Ver"
          desc="Consulta general de packings"
          onClick={() => router.push("/admin/view")}
        />

        <Card
          title="Editar"
          desc="Edición administrativa"
          onClick={() => router.push("/admin/edit")}
        />
      </div>
    </div>
  );
}
