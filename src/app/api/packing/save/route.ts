import { NextResponse } from "next/server";
import { readJson, writeJson } from "@/lib/json-db";

type SaveBody = {
  status: "draft" | "final";
  packing: {
    invoice_no: string;
    header: any;
    lines: any[];
    created_at?: string;
  };
};

// Convierte 30/11/2025 → 11/30/2025
function normalizeDate(d: string) {
  if (!d) return "";
  if (d.includes("-")) return d; // viene en ISO

  const parts = d.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${month}/${day}/${year}`;
  }
  return d;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SaveBody;

    // VALIDACIONES BÁSICAS
    if (!body?.packing?.invoice_no?.trim()) {
      return NextResponse.json(
        { error: "Invoice number is required" },
        { status: 400 }
      );
    }
    if (!body.packing.header) {
      return NextResponse.json(
        { error: "Header missing" },
        { status: 400 }
      );
    }
    if (!Array.isArray(body.packing.lines) || body.packing.lines.length === 0) {
      return NextResponse.json(
        { error: "At least one box is required" },
        { status: 400 }
      );
    }

    // Normalizar fecha
    body.packing.header.date = normalizeDate(body.packing.header.date);

    // Cargar base
    const store = await readJson<any[]>("packings.json", []);
    const exists = store.find(
      (p) =>
        String(p.packing?.invoice_no).toUpperCase() ===
        body.packing.invoice_no.toUpperCase()
    );

    if (exists && body.status === "final") {
      return NextResponse.json(
        { error: "Invoice already exists" },
        { status: 409 }
      );
    }

    const payload = {
      ...body,
      packing: {
        ...body.packing,
        created_at: body.packing.created_at ?? new Date().toISOString(),
      },
    };

    if (exists) {
      exists.status = body.status;
      exists.packing = payload.packing;
    } else {
      store.push(payload);
    }

    await writeJson("packings.json", store);
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("SAVE PACKING ERROR:", err);
    return NextResponse.json(
      { error: "Internal error while saving packing" },
      { status: 500 }
    );
  }
}
