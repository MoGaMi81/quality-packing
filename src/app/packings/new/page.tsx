"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NewPackingWizard from "@/components/NewPackingWizard";

export default function NewPackingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("draft");

  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!id) {
      alert("Draft inválido");
      router.replace("/drafts");
    }
  }, [id, router]);

  return (
    <>
      <NewPackingWizard
        open={open}
        onClose={() => {
          setOpen(false);
          router.replace("/drafts");
        }}
      />
    </>
  );
}
