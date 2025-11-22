"use client";
import React, { useState } from "react";
import Modal from "./Modal";
import { fetchJSON } from "@/lib/fetchJSON";
import type { NewClientInput } from "@/domain/models/newInputs";

type Props = {
  open: boolean;
  presetCode?: string;
  onClose: () => void;
  onCreated: (client: any) => void;
};

export default function NewClientModal({ open, presetCode = "", onClose, onCreated }: Props) {
  const [form, setForm] = useState<NewClientInput>({
    code: presetCode, name: "", address: "", city: "", state: "", country: "USA", zip: "", tax_id: ""
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const update = (k: keyof NewClientInput, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async () => {
    setErr(null);
    if (!form.code.trim() || !form.name.trim()) { setErr("Code and Name are required"); return; }
    setLoading(true);
    try {
      const res = await fetchJSON<{ ok: true; client: any }>("/api/catalogs/client", {
        method: "POST",
        body: JSON.stringify(form),
      });
      onCreated(res.client);
      onClose();
    } catch (e: any) {
      setErr(String(e.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title="New Client" onClose={onClose}>
      <div style={{ display:"grid", gap:10 }}>
        {err && <div style={{ color:"#b00" }}>{err}</div>}
        <div style={{ display:"grid", gridTemplateColumns:"120px 1fr", gap:8 }}>
          <label>Code*</label><input value={form.code} onChange={e=>update("code", e.target.value.toUpperCase())}/>
          <label>Name*</label><input value={form.name} onChange={e=>update("name", e.target.value)}/>
          <label>Address</label><input value={form.address} onChange={e=>update("address", e.target.value)}/>
          <label>City</label><input value={form.city} onChange={e=>update("city", e.target.value)}/>
          <label>State</label><input value={form.state} onChange={e=>update("state", e.target.value)}/>
          <label>Country</label><input value={form.country} onChange={e=>update("country", e.target.value)}/>
          <label>ZIP</label><input value={form.zip} onChange={e=>update("zip", e.target.value)}/>
          <label>Tax ID</label><input value={form.tax_id} onChange={e=>update("tax_id", e.target.value)}/>
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
          <button onClick={onClose} disabled={loading}>Cancel</button>
          <button onClick={submit} disabled={loading}>{loading ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </Modal>
  );
}
