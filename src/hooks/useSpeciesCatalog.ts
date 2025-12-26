import { useEffect, useState } from "react";
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
    supabase
      .from("species")
      .select("code, description_en, form, size")
      .then(({ data, error }) => {
        if (!error && data) setItems(data);
        setLoading(false);
      });
  }, []);

  function getByCode(code: string) {
    return items.find(
      (i) => i.code.toUpperCase() === code.toUpperCase()
    ) ?? null;
  }

  return { items, getByCode, loading };
}
