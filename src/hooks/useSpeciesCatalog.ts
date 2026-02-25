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

  useEffect(() => {
    let mounted = true;

    (async () => {
      console.log("🧍 Cargando catálogo species...");
      const { data, error } = await supabase
        .from("species")
        .select("code, description_en, form, size");

      if (!mounted) return;

      if (error) {
        console.error("❌ Error al cargar species:", error);
        setItems([]);
      } else if (data && data.length > 0) {
        console.log("✅ Catálogo cargado correctamente");
        setItems(data);
      } else {
        console.warn("⚠️ Catálogo vacío");
        setItems([]);
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const normalize = (v: string) =>
    v.toUpperCase()?.trim().replace(/\s+/g, "").replace(/–|—/g, "-");

  const getByCode = useCallback(
    (code: string) => {
      if (!code) return null;
      const c = normalize(code);
      const match = items.find((i) => normalize(i.code) === c);
      console.log("🔍 buscando:", c);
      console.log("📦 catálogo normalizado:", items.map(i => normalize(i.code)));
      console.log("✅ match encontrado:", match);
      return match ?? null;
    },
    [items]
  );

  return { loading, getByCode, items };
}