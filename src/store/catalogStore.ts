"use client";

import { create } from "zustand";

/* =======================
   TYPES
======================= */

export type CatalogItem = {
  code: string;
  description_en: string;
  form: string;
  size: string;
  scientific_name?: string;
};

type State = {
  items: CatalogItem[];
  byCode: Record<string, CatalogItem>;

  setCatalog: (items: CatalogItem[]) => void;
  getByCode: (code: string) => CatalogItem | null;
};

/* =======================
   STORE
======================= */

export const useCatalogStore = create<State>((set, get) => ({
  items: [],
  byCode: {},

  setCatalog: (items) =>
    set(() => ({
      items,
      byCode: Object.fromEntries(
        items.map((i) => [i.code.toUpperCase(), i])
      ),
    })),

  getByCode: (code) => {
    if (!code) return null;
    return get().byCode[code.toUpperCase()] ?? null;
  },
}));
