"use client";

import { useEffect, useState, useCallback } from "react";
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
    async function load() {
      const { data, error } = await supabase
        .from("species")
        .select("code, description_en, form, size");

      if (!error && data) {
        setItems(data);
      }

      setLoading(false);
    }

    load();
  }, []);

  const getByCode = useCallback(
    (code: string) => {
      const c = code.trim().toUpperCase();
      return items.find(i => i.code === c) ?? null;
    },
    [items]
  );

  return { getByCode, loading };
}
