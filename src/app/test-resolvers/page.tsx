"use client";
import { useState } from "react";
import { useClientResolver } from "@/hooks/useClientResolver";
import { useSpeciesResolver } from "@/hooks/useSpeciesResolver";

export default function TestResolvers() {
  const [clientCode, setClientCode] = useState("");
  const [speciesCode, setSpeciesCode] = useState("");

  const client = useClientResolver();
  const species = useSpeciesResolver();

  return (
    <main style={{ padding: 24, display:"grid", gap:24 }}>
      <h1>Resolver demo</h1>

      <section style={{ display:"grid", gap:8 }}>
        <h3>Client</h3>
        <div style={{ display:"flex", gap:8 }}>
          <input placeholder="Client code (e.g. HE)" value={clientCode} onChange={e=>setClientCode(e.target.value)} />
          <button onClick={()=> client.ask(clientCode)}>Resolve</button>
        </div>
        {client.resolved && (
          <pre>{JSON.stringify(client.resolved, null, 2)}</pre>
        )}
      </section>

      <section style={{ display:"grid", gap:8 }}>
        <h3>Species by key</h3>
        <div style={{ display:"flex", gap:8 }}>
          <input placeholder="Species key (e.g. ARS1-22)" value={speciesCode} onChange={e=>setSpeciesCode(e.target.value)} />
          <button onClick={()=> species.ask(speciesCode)}>Resolve</button>
        </div>
        {species.resolved && (
          <pre>{JSON.stringify(species.resolved, null, 2)}</pre>
        )}
      </section>

      {/* Modales */}
      {client.modal}
      {species.modal}
    </main>
  );
}
