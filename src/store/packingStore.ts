"use client";

import { create } from "zustand";

/* =======================
   TYPES
======================= */

export type PackingLine = {
  box_no: number;
  code: string;
  description_en: string;
  form: string;
  size: string;
  pounds: number;
  scientific_name: string;
  is_combined?: boolean;
};

export type PackingHeader = {
  invoice_no: string;
  date: string;
  client_code: string;
  guide: string;
};

type PackingStatus = "draft" | "final";

/* =======================
   STATE
======================= */

type State = {
  packing_id: string | null;
  status: PackingStatus;

  header: PackingHeader | null;
  lines: PackingLine[];

  /* header */
  setHeader: (h: PackingHeader) => void;

  /* lines */
  setLines: (lines: PackingLine[]) => void;
  addLine: (ln: PackingLine) => void;
  addLines: (arr: PackingLine[]) => void;
  removeLine: (index: number) => void;
  reorder: (arr: PackingLine[]) => void;

  /* lifecycle */
  loadFromDB: (data: {
    packing_id: string;
    status: PackingStatus;
    header: PackingHeader;
    lines: PackingLine[];
  }) => void;

  markDraft: () => void;
  clear: () => void;
  reset: () => void;
};

/* =======================
   STORE
======================= */

export const usePackingStore = create<State>((set) => ({
  packing_id: null,
  status: "draft",

  header: null,
  lines: [],

  /* ---------- header ---------- */
  setHeader: (h) =>
    set(() => ({
      header: h,
    })),

  /* ---------- lines ---------- */
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

  /* ---------- lifecycle ---------- */
  loadFromDB: (data) =>
    set(() => ({
      packing_id: data.packing_id,
      status: data.status,
      header: data.header,
      lines: data.lines,
    })),

    setLines: (lines) => set({ lines }),

  markDraft: () =>
    set(() => ({
      status: "draft",
    })),

  clear: () =>
    set(() => ({
      lines: [],
    })),

  reset: () =>
    set(() => ({
      packing_id: null,
      status: "draft",
      header: null,
      lines: [],
    })),
}));
