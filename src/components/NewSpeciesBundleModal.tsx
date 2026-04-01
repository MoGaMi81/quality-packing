"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { fetchJSON } from "@/lib/fetchJSON";
import type { NewSpeciesBundleInput } from "@/domain/models/newInputs";
import { useSpeciesCatalog } from "@/hooks/useSpeciesCatalog"; // 🛠️ PASO 1 — IMPORTAR

type Props = {
  open: boolean;
  presetCode?: string;
  onClose: () => void;
  onCreated: (payload: {
    map: any;
    species: any;
    size: any;
    form: any;
  }) => void;
};

export default function NewSpeciesBundleModal({
  open,
  presetCode = "",
  onClose,
  onCreated,
}: Props) {
  const [form, setForm] = useState<NewSpeciesBundleInput>({
    code: "",
    name_en: "",
    scientific_name: "",
    size: "",
    form: "W&G",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const { getScientificSuggestion } = useSpeciesCatalog(); // 🛠️ PASO 2 — USAR EL HOOK

  useEffect(() => {
    if (open) {
      setForm({
        code: presetCode,
        name_en: "",
        scientific_name: "",
        size: "",
        form: "W&G",
      });
      setErr(null);
    }
  }, [open, presetCode]);

  // 🛠️ PASO 4 — DETECTAR CAMBIO EN NAME
  useEffect(() => {
    if (!form.name_en) return;

    // solo autocompletar si está vacío
    if (form.scientific_name) return;

    const suggestion = getScientificSuggestion(form.name_en);

    if (suggestion) {
      setForm((prev) => ({ ...prev, scientific_name: suggestion }));
    }
  }, [form.name_en, form.scientific_name, getScientificSuggestion]);

  const update = (k: keyof NewSpeciesBundleInput, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async () => {
    setErr(null);

    if (!form.code?.trim() || !form.name_en?.trim() || !form.size?.trim()) {
      setErr("Code, Name EN and Size are required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetchJSON<{
        ok: true;
        map: any;
        species: any;
        size: any;
        form: any;
      }>("/api/catalogs/species-bundle", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          code: form.code.toUpperCase(),
        }),
      });

      onCreated(res);
      onClose();
    } catch (e: any) {
      setErr(e.message || "Error saving species");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title="New Species (by key)" onClose={onClose}>
      <div className="space-y-4">
        {err && (
          <div className="bg-red-100 text-red-700 p-2 rounded text-sm">
            {err}
          </div>
        )}

        {/* CODE */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Key (code) *
          </label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.code}
            onChange={(e) => update("code", e.target.value.toUpperCase())}
          />
        </div>

        {/* NAME */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Name EN *
          </label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.name_en}
            onChange={(e) => update("name_en", e.target.value.toUpperCase())}
          />
        </div>

        {/* SCIENTIFIC */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Scientific name
          </label>
          <input
            className="w-full border rounded px-3 py-2"
            value={form.scientific_name}
            onChange={(e) =>
              update("scientific_name", e.target.value.toUpperCase())
            }
          />
        </div>

        {/* SIZE + FORM */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Size *</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.size}
              onChange={(e) => update("size", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Form</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.form}
              onChange={(e) => update("form", e.target.value)}
            />
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={submit}
            className="px-4 py-2 bg-black text-white rounded"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}