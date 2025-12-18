// src/store/packingStore.ts
"use client";

import { create } from "zustand";
import type { PackingHeader } from "@/domain/packing/types";

export type SimpleLine = {
  scientific_name: any;
  box_no: number;
  code: string;
  description_en: string;
  form: string;
  size: string;
  pounds: number;
};

// 👇 Este tipo representa EXPLICITAMENTE lo que reciben los modales
export type SimpleItem = {
  code: string;
  description_en: string;
  form: string;
  size: string;
  pounds: number;
};

type State = {
  header: PackingHeader | null;
  lines: SimpleLine[];
  lastBoxNo: number;

  setHeader: (h: PackingHeader) => void;

  // antes aceptaba Omit<SimpleLine, "box_no">
  // ahora acepta SimpleItem para evitar errores TS
  addLine: (item: SimpleItem, boxNoOverride?: number) => void;

  deleteBox: (boxNo: number) => void;
  clear: () => void;
};

export const usePackingStore = create<State>((set, get) => ({
  header: null,
  lines: [],
  lastBoxNo: 0,

  setHeader: (h) => set({ header: h }),

  addLine: (item, boxNoOverride) =>
    set((state) => {
      const box_no =
        typeof boxNoOverride === "number"
          ? boxNoOverride
          : state.lastBoxNo + 1;

      const newLast = Math.max(state.lastBoxNo, box_no);

      return {
        lines: [
          ...state.lines,
          {
            box_no,
            code: item.code,
            description_en: item.description_en,
            form: item.form,
            size: item.size,
            pounds: item.pounds,
          },
        ],
        lastBoxNo: newLast,
      };
    }),

  deleteBox: (boxNo) =>
    set((state) => {
      const filtered = state.lines.filter((l) => l.box_no !== boxNo);

      const newLast =
        filtered.length === 0
          ? 0
          : Math.max(...filtered.map((l) => l.box_no));

      return { lines: filtered, lastBoxNo: newLast };
    }),

  clear: () => set({ header: null, lines: [], lastBoxNo: 0 }),
}));

