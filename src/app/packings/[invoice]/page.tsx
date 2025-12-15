"use client";

import { useState } from "react";
import PackingActionsModal from "@/components/PackingActionsModal";
import { getRole } from "@/lib/role";

export default function PackingEntryPage({ params }: { params: { invoice: string } }) {
  const invoice = params.invoice.toUpperCase();
  const [open, setOpen] = useState(true);
  const role = getRole();

  return (
    <main className="p-8">
      <PackingActionsModal
        open={open}
        invoice={invoice}
        onClose={() => setOpen(false)}
        isAdmin={role === "admin"}
      />

      {!open && (
        <div className="text-center text-gray-500">
          Selecciona una acción del menú superior o regresa.
        </div>
      )}
    </main>
  );
}
