"use client";

import { useEffect, useState } from "react";
import { getRoleSafe } from "@/lib/session";

export function useSession() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const r = getRoleSafe();
    setRole(r);
    setLoading(false);
  }, []);

  return { role, loading };
}