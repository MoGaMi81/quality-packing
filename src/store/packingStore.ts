// src/store/packingStore.ts
"use client";

import { create } from "zustand";

export type PackingLine = {
  box_no: number;
  code: string;
  description_en: string;
  form: string;
  size: string;
  pounds: number;
  scientific_name: string;
};

type State = {
  lines: PackingLine[];

  clear: () => void;

  addLine: (ln: PackingLine) => void;

  addLines: (arr: PackingLine[]) => void;

  removeLine: (index: number) => void;

  reorder: (arr: PackingLine[]) => void;
};

export const usePackingStore = create<State>((set) => ({
  lines: [],

  clear: () => set({ lines: [] }),

  addLine: (ln) =>
    set((state) => ({
      lines: [...state.lines, ln],
    })),

  addLines: (arr) =>
    set((state) => ({
      lines: [...state.lines, ...arr],
    })),

  removeLine: (index) =>
    set((state) => {
      const newLines = [...state.lines];
      newLines.splice(index, 1);
      return { lines: newLines };
    }),

  reorder: (arr) => set({ lines: arr }),
}));


