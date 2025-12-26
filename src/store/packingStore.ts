"use client";

import { create } from "zustand";
import type { PackingLine } from "@/domain/packing/types";

/* =======================
   TYPES
======================= */

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

  /* ---------- header ---------- */
  setHeader: (h: PackingHeader) => void;

  /* ---------- lines ---------- */
  setLines: (lines: PackingLine[]) => void;
  addLine: (ln: PackingLine) => void;
  addLines: (arr: PackingLine[]) => void;
  removeLine: (index: number) => void;
  removeBox: (boxNo: number) => void;
  reorder: (arr: PackingLine[]) => void;

  /* ---------- helpers ---------- */
  getNextBoxNo: () => number;

  /* ---------- lifecycle ---------- */
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

export const usePackingStore = create<State>((set, get) => ({
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
  setLines: (lines) => set({ lines }),

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
      const copy = [...state.lines];
      copy.splice(index, 1);
      return { lines: copy };
    }),

  removeBox: (boxNo) =>
    set((state) => ({
      lines: state.lines.filter(
        (l) => Number(l.box_no) !== boxNo
      ),
    })),

  reorder: (arr) => set({ lines: arr }),

  /* ---------- helpers ---------- */
  getNextBoxNo: () => {
    const lines = get().lines;
    if (lines.length === 0) return 1;
    return (
      Math.max(
        ...lines
          .map((l) => Number(l.box_no))
          .filter((n) => !isNaN(n))
      ) + 1
    );
  },

  /* ---------- lifecycle ---------- */
  loadFromDB: (data) =>
    set(() => ({
      packing_id: data.packing_id,
      status: data.status,
      header: data.header,
      lines: data.lines,
    })),

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
