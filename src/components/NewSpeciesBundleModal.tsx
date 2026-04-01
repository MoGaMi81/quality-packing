"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useSpeciesCatalog } from "@/hooks/useSpeciesCatalog";

type Props = {
  open: boolean;
  presetCode?: string;
  onClose: () => void;
  onCreated: (payload: any) => void;
};

export default function NewSpeciesBundleModal({
  open,
  presetCode,
  onClose,
  onCreated,
}: Props) {
  const { getScientificSuggestion, reload } = useSpeciesCatalog();

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [size, setSize] = useState("");
  const [form, setForm] = useState("W&G");

  // 🔥 NUEVO CONTROL
  const [scientificNameAuto, setScientificNameAuto] = useState(true);

  // ============================================================
  // 🔄 RESET AL ABRIR
  // ============================================================
  useEffect(() => {
    if (open) {
      setCode(presetCode || "");
      setDescription("");
      setScientificName("");
      setSize("");
      setForm("W&G");
      setScientificNameAuto(true);
    }
  }, [open, presetCode]);

  // ============================================================
  // 🤖 AUTOCOMPLETE INTELIGENTE
  // ============================================================
  useEffect(() => {
    if (!description) return;

    const suggestion = getScientificSuggestion(description);

    if (!scientificName || scientificNameAuto) {
      if (suggestion) {
        setScientificName(suggestion);
        setScientificNameAuto(true);
      }
    }
  }, [description]);

  // ============================================================
  // 💾 GUARDAR
  // ============================================================
  const handleSave = async () => {
    if (!code || !description || !size || !form) {
      alert("Completa los campos requeridos");
      return;
    }

    const { data, error } = await supabase
      .from("species")
      .insert([
        {
          code: code.toUpperCase(),
          description_en: description.toUpperCase(),
          scientific_name: scientificName || null,
          size,
          form,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Error al guardar especie");
      return;
    }

    // 🔥 FEEDBACK
    alert("Especie guardada correctamente");

    // 🔥 refrescar catálogo
    await reload();

    onCreated({
      map: {
        code: data.code,
      },
    });
  };

  if (!open) return null;

  return (
    <div className="p-6 bg-white rounded shadow max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">New Species (by key)</h2>
        <button onClick={onClose}>Cerrar</button>
      </div>

      {/* CODE */}
      <label className="block text-sm font-medium">Key (code) *</label>
      <input
        className="w-full border p-2 rounded mb-3"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      {/* NAME */}
      <label className="block text-sm font-medium">Name EN *</label>
      <input
        className="w-full border p-2 rounded mb-3"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* SCIENTIFIC */}
      <label className="block text-sm font-medium">Scientific name</label>
      <input
        className="w-full border p-2 rounded mb-3"
        value={scientificName}
        onChange={(e) => {
          setScientificName(e.target.value);
          setScientificNameAuto(false); // 🔥 evita override
        }}
      />

      {/* SIZE + FORM */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Size *</label>
          <input
            className="w-full border p-2 rounded"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Form</label>
          <input
            className="w-full border p-2 rounded"
            value={form}
            onChange={(e) => setForm(e.target.value)}
          />
        </div>
      </div>

      {/* BUTTONS */}
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="border px-4 py-2 rounded"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
}