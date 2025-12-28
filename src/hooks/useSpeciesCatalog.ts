"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { normalizeCode } from "@/lib/normalizeCode";

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

  useEffect(() => {
  let mounted = true;

  (async () => {
    const { data, error } = await supabase
      .from("species")
      .select("code, description_en, form, size");

    console.log("🧪 RAW SPECIES DATA:", data);

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

  const getByCode = useCallback(
  (rawCode: string) => {
    const c = normalizeCode(rawCode);

    return (
      items.find(
        (i) => normalizeCode(i.code) === c
      ) ?? null
    );
  },
  [items]
);


  return {
    loading,
    getByCode,
    items,
  };
}
