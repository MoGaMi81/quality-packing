"use client";

import type { PackingLine } from "@/domain/packing/types";

type Props = {
  boxNo: number | null;
  lines: PackingLine[];
  onClose: () => void;
  onUpdate: (lines: PackingLine[]) => void;
  onDeleteBox: () => void;
};

export default function EditBoxModal({
  boxNo,
  lines,
  onClose,
  onUpdate,
  onDeleteBox,
}: Props) {
  if (boxNo === null) return null;

  const updatePounds = (i: number, pounds: number) => {
    const copy = [...lines];
    copy[i] = { ...copy[i], pounds };
    onUpdate(copy);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-lg p-5">
        <h2 className="text-xl font-bold mb-4">
          Editar Caja #{boxNo}
        </h2>

        {lines.map((l, i) => (
          <div key={i} className="border p-3 rounded mb-2">
            <div className="font-semibold">{l.code}</div>
            <div className="text-sm">
              {l.description_en}
            </div>

            <input
              type="number"
              value={l.pounds}
              onChange={(e) =>
                updatePounds(i, +e.target.value)
              }
              className="border rounded px-2 py-1 mt-2 w-full"
            />
          </div>
        ))}

        <div className="flex justify-between mt-4">
          <button
            onClick={onDeleteBox}
            className="text-red-600"
          >
            Eliminar caja
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="border px-4 py-2 rounded"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
