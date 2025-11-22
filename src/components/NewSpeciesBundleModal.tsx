"use client";
import React, { useState } from "react";
import Modal from "./Modal";
import { fetchJSON } from "@/lib/fetchJSON";
import type { NewSpeciesBundleInput } from "@/domain/models/newInputs";

type Props = {
  open: boolean;
  presetCode?: string;
  onClose: () => void;
  onCreated: (payload: { map:any; species:any; size:any; form:any }) => void;
};

export default function NewSpeciesBundleModal({ open, presetCode = "", onClose, onCreated }: Props) {
  const [form, setForm] = useState<NewSpeciesBundleInput>({
    code: presetCode, name_en:"", scientific_name:"", size:"", form:"W&G"
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const update = (k: keyof NewSpeciesBundleInput, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async () => {
    setErr(null);
    if (!form.code.trim() || !form.name_en.trim() || !form.size.trim()) {
      setErr("Code, Name EN and Size are required"); return;
    }
    setLoading(true);
    try {
      const res = await fetchJSON<{ ok:true; map:any; species:any; size:any; form:any }>("/api/catalogs/species-bundle", {
        method: "POST",
        body: JSON.stringify({ ...form, code: form.code.toUpperCase() }),
      });
      onCreated({ map: res.map, species: res.species, size: res.size, form: res.form });
      onClose();
    } catch (e:any) {
      setErr(String(e.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title="New Species (by key)" onClose={onClose}>
      <div style={{ display:"grid", gap:10 }}>
        {err && <div style={{ color:"#b00" }}>{err}</div>}
        <div style={{ display:"grid", gridTemplateColumns:"160px 1fr", gap:8 }}>
          <label>Key (code)*</label><input value={form.code} onChange={e=>update("code", e.target.value.toUpperCase())}/>
          <label>Name EN*</label><input value={form.name_en} onChange={e=>update("name_en", e.target.value)}/>
          <label>Scientific name</label><input value={form.scientific_name} onChange={e=>update("scientific_name", e.target.value.toUpperCase())}/>
          <label>Size*</label><input value={form.size} onChange={e=>update("size", e.target.value)}/>
          <label>Form</label><input value={form.form} onChange={e=>update("form", e.target.value)}/>
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={onClose} disabled={loading}>Cancel</button>
          <button onClick={submit} disabled={loading}>{loading ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </Modal>
  );
}
