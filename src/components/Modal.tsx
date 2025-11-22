// src/components/Modal.tsx
"use client";
import { ReactNode, useEffect } from "react";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string; // p.ej. "max-w-lg"
};

// patrón de modal base
export default function Modal({ open, title, onClose, children }:{
  open: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-3xl p-5 shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="px-3 py-1 border rounded">Cerrar</button>
        </div>
        {children}
      </div>
    </div>
  );
}
