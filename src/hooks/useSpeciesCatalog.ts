"use client"

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export type SpeciesItem = {
  code: string;
  description_en: string;
  form: string;
  size: string;
};

export function useSpeciesCatalog() {
  const [items, setItems] = useState<SpeciesItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      console.log("♟️ Cargando catálogo species...");
      const { data, error } = await supabase
        .from("species")
        .select("code, description_en, form, size");

      console.log("📦 data:", data);
      console.log("❌ error:", error);

      if (!mounted) return;

      if (!error && data) {
        setItems(data);
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const getByCode = useMemo(() => {
    const map = new Map<string, SpeciesItem>();
    items.forEach(i => map.set(i.code.toUpperCase(), i));
    return (code: string) => map.get(code.toUpperCase()) ?? null;
  }, [items]);

  return { items, getByCode, loading };
}

