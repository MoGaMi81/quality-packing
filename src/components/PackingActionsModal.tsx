"use client";

type Props = {
  open: boolean;
  invoice: string;
  onClose: () => void;
  isAdmin: boolean;
};

export default function PackingActionsModal({ open, invoice, onClose, isAdmin }: Props) {
  if (!open) return null;

  const go = (url: string) => {
    window.location.href = url;
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-lg space-y-4">
        <h2 className="text-xl font-bold text-center">
          Opciones — Factura {invoice}
        </h2>

        <div className="space-y-3">
          <button
            className="w-full py-2 border rounded hover:bg-gray-100"
            onClick={() => go(`/packings/${invoice}/view`)}
          >
            🔍 Ver Packing
          </button>

          <button
            className="w-full py-2 border rounded hover:bg-gray-100"
            onClick={() => go(`/packings/${invoice}/edit`)}
          >
            📝 Editar Packing
          </button>

          <button
            className="w-full py-2 border rounded hover:bg-gray-100"
            onClick={() => go(`/packings/${invoice}/pricing`)}
          >
            💵 Capturar Precios
          </button>

          <button
            className="w-full py-2 border rounded hover:bg-gray-100"
            onClick={() => go(`/packings/${invoice}/invoice`)}
          >
            📄 Ver Factura
          </button>

          {isAdmin && (
            <button
              className="w-full py-2 border rounded text-red-600 hover:bg-red-50"
              onClick={() => go(`/packings/${invoice}/delete`)}
            >
              🗑 Eliminar Packing
            </button>
          )}
        </div>

        <button
          className="w-full mt-4 py-2 bg-black text-white rounded"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
