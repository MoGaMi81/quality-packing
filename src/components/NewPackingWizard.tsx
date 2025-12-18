"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { usePackingStore } from "@/store/packingStore";
import AddBoxModal from "@/components/AddBoxModal";
import AddRangeModal from "@/components/AddRangeModal";
import AddCombinedModal from "@/components/AddCombinedModal";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function NewPackingWizard({ open, onClose }: Props) {
  const { clear, lines, addLine } = usePackingStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [invoice, setInvoice] = useState("");
  const [validating, setValidating] = useState(false);

  const [clients, setClients] = useState<any[]>([]);
  const [clientCode, setClientCode] = useState("");
  const [clientResolved, setClientResolved] = useState<any | null>(null);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [modalSimple, setModalSimple] = useState(false);
  const [modalRange, setModalRange] = useState(false);
  const [modalCombined, setModalCombined] = useState(false);

  // ---------------------------
  // Cargar clientes al abrir
  // ---------------------------
  useEffect(() => {
    if (open) {
      clear();
      setStep(1);
      setInvoice("");
      setClientCode("");
      setClientResolved(null);

      loadClients();
    }
  }, [open]);

  async function loadClients() {
    const { data } = await supabase.from("clients").select("*").order("code");
    setClients(data || []);
  }

  if (!open) return null;

  // --------------------------
  // Paso 1 — Validar factura
  // --------------------------
  async function goStep1() {
    if (!invoice.trim()) return;
    setValidating(true);

    const inv = invoice.toUpperCase();

    const { data, error } = await supabase
      .from("packings")
      .select("id")
      .eq("invoice_no", inv)
      .single();

    setValidating(false);

    if (data) {
      // Ya existe → abrir menú de opciones (view/edit/pricing/export)
      alert("La factura ya existe. Continuará con menú de opciones.");
      window.location.href = `/packings/${inv}`;
      return;
    }

    setStep(2);
  }

  // --------------------------
  // Paso 2 — Elegir cliente
  // --------------------------
  function resolveClient() {
    const c = clients.find((x) => x.code.toUpperCase() === clientCode.toUpperCase());
    setClientResolved(c || null);
    if (!c) alert("Cliente no encontrado.");
    else setStep(3);
  }

  // --------------------------
  // Paso 3 — Guardar packing en Supabase
  // --------------------------
  async function saveHeader() {
    if (!clientResolved) {
      alert("Selecciona un cliente válido.");
      return;
    }

    const body = {
      invoice_no: invoice.toUpperCase(),
      client_code: clientResolved.code,
      client_name: clientResolved.name,
      address: `${clientResolved.address}, ${clientResolved.city}, ${clientResolved.state}, ${clientResolved.zip}, ${clientResolved.country}`,
      date,
    };

    const r = await fetch("/api/packings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const res = await r.json();

    if (res.exists) {
      alert("Esta factura ya existe.");
      return;
    }

    if (!res.ok) {
      alert("Error al crear header.");
      return;
    }

    alert("Packing creado. Ahora agrega cajas.");
  }

  // --------------------------
  // FINALIZAR → guardar cajas
  // --------------------------
  async function finalize() {
    const inv = invoice.toUpperCase();

    const { data: header } = await supabase
      .from("packings")
      .select("id")
      .eq("invoice_no", inv)
      .single();

    if (!header) {
      alert("No se encontró el packing creado.");
      return;
    }

    const packing_id = header.id;

    // Insertar líneas
    for (const ln of lines) {
      await supabase.from("packing_lines").insert({
        packing_id,
        box_no: ln.box_no,
        code: ln.code,
        description_en: ln.description_en,
        form: ln.form,
        size: ln.size,
        pounds: ln.pounds,
        scientific_name: ln.scientific_name,
      });
    }

    alert("Packing guardado correctamente.");
    window.location.href = `/packings/${inv}/view`;
  }

  // ============================
  // RENDER
  // ============================

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Paso {step} de 3</h1>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <label>Factura</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
            />

            <button
              disabled={validating}
              onClick={goStep1}
              className="mt-4 bg-black text-white px-4 py-2 rounded w-full"
            >
              {validating ? "Validando..." : "Continuar"}
            </button>

            <button onClick={onClose} className="mt-4 text-red-600 underline w-full">
              Cancelar
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <label>Cliente (código)</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={clientCode}
              onChange={(e) => setClientCode(e.target.value)}
            />

            <button
              onClick={resolveClient}
              className="mt-4 bg-black text-white px-4 py-2 rounded w-full"
            >
              Continuar
            </button>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <p className="font-bold text-lg mb-3">
              Cliente: {clientResolved?.name}
            </p>

            <label>Fecha</label>
            <input
              type="date"
              className="border rounded px-3 py-2 w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <button
              onClick={saveHeader}
              className="mt-4 bg-green-700 text-white px-4 py-2 rounded w-full"
            >
              Guardar encabezado
            </button>

            <hr className="my-4" />

            <p className="font-bold">Agregar cajas:</p>

            <div className="flex gap-3 mt-3">
              <button
                onClick={() => setModalSimple(true)}
                className="px-3 py-2 bg-black text-white rounded"
              >
                Simple
              </button>
              <button
                onClick={() => setModalRange(true)}
                className="px-3 py-2 bg-black text-white rounded"
              >
                Rango
              </button>
              <button
                onClick={() => setModalCombined(true)}
                className="px-3 py-2 bg-black text-white rounded"
              >
                Combinada
              </button>
            </div>

            <button
              onClick={finalize}
              className="mt-6 bg-blue-700 text-white px-4 py-2 rounded w-full"
            >
              Finalizar Packing
            </button>
          </>
        )}
      </div>

      {/* MODALES */}
      <AddBoxModal open={modalSimple} onClose={() => setModalSimple(false)} onAdded={addLine} />
      <AddRangeModal open={modalRange} onClose={() => setModalRange(false)} onAdded={(items) => {
        for (const it of items) addLine(it);
      }} />
      <AddCombinedModal open={modalCombined} onClose={() => setModalCombined(false)} onAdded={(items) => {
        for (const it of items) addLine(it);
      }} />
    </div>
  );
}
