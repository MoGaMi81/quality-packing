"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NewPackingWizard from "@/components/NewPackingWizard";

export default function NewPackingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const draftId = searchParams.get("draft");

  const [open, setOpen] = useState(true);

  // Si no viene draft, regresamos
  useEffect(() => {
    if (!draftId) {
      alert("Draft inválido");
      router.push("/drafts");
    }
  }, [draftId, router]);

  return (
    <>
      <NewPackingWizard
        open={open}
        onClose={() => {
          setOpen(false);
          router.push("/drafts");
        }}
      />
    </>
  );
}
