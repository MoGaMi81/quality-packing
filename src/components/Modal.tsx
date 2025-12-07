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

export default function Modal({
  open,
  title,
  onClose,
  children,
  widthClass = "max-w-lg"
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
      onClick={onClose} // clic fuera cierra modal
    >
      <div
        className={`bg-white rounded-xl p-5 shadow-xl w-full ${widthClass}`}
        
        onClick={(e) => e.stopPropagation()} 
        // ⬆️ ⬆️ ⬆️ ESSENCIAL:
        // evita que el click se pierda y permite que los botones funcionen
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="px-3 py-1 border rounded hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>

        {/* CONTENIDO */}
        {children}
      </div>
    </div>
  );
}

