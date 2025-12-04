// src/components/Modal.tsx
"use client";

import { ReactNode } from "react";

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
};

export default function Modal({ open, title, onClose, children, widthClass = "max-w-lg" }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
      onClick={onClose}              // ⬅ clic fuera cierra
    >
      <div
        className={`bg-white rounded-xl w-full ${widthClass} p-5 shadow-xl animate-fade`}
        onClick={(e) => e.stopPropagation()}   // ⬅ clic dentro NO cierra
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="px-3 py-1 border rounded">
            Cerrar
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

