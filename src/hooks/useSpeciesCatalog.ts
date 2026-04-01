"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

export type SpeciesItem = {
  code: string;
  description_en: string;
  scientific_name?: string | null;
  form: string;
  size: string;
};

export function useSpeciesCatalog() {
  const [items, setItems] = useState<SpeciesItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("species")
      .select("code, description_en, scientific_name, form, size");

    if (error) {
      console.error("❌ Error al cargar species:", error);
      setItems([]);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const normalize = (v: string) =>
    v?.toUpperCase().trim().replace(/\s+/g, "").replace(/–|—/g, "-");

  const getByCode = useCallback(
    (code: string) => {
      if (!code) return null;
      const c = normalize(code);
      return items.find((i) => normalize(i.code) === c) ?? null;
    },
    [items]
  );

  const findClosestMatch = useCallback(
  (input: string) => {
    if (!input) return null;

    const cleanInput = input
      .toUpperCase()
      .replace(/\d+-\d+/g, "") // quitar talla
      .replace(/\s+/g, " ")
      .trim();

    const words = cleanInput.split(" ");

    return items.find((i) => {
      const desc = i.description_en.toUpperCase();

      // 🔥 match por palabras (no por frase completa)
      return words.some((w) => desc.includes(w));
    }) ?? null;
  },
  [items]
);

const getScientificSuggestion = useCallback(
  (input: string) => {
    const match = findClosestMatch(input);
    return match?.scientific_name ?? null;
  },
  [findClosestMatch]
);

  return {
  loading,
  getByCode,
  items,
  reload: load,

  // 🔥 NUEVO
  findClosestMatch,
  getScientificSuggestion,
};
}