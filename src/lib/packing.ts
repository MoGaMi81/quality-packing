// src/lib/packing.ts
import prisma from "@/lib/prisma";

export type PackingItem = {
  boxNo: number;
  species: string;
  size?: string;
  pieces?: number;
  weightKg?: number;
  weightLb?: number;
};

export type PackingStatus = "draft" | "final" | undefined;

export type Packing = {
  id: string;
  invoice: string;
  date?: string;        // la devolvemos como ISO string
  customer?: string;
  vessel?: string;
  status?: PackingStatus;
  items: PackingItem[];
  totals?: { kg: number; lb: number };
};

/**
 * Obtener un packing por número de factura.
 */
export async function getPackingByInvoice(
  invoice: string
): Promise<Packing | null> {
  const p = await prisma.packing.findUnique({
    where: { invoice },
    include: { items: { orderBy: { boxNo: "asc" } } },
  });

  if (!p) return null;

  const items: PackingItem[] = p.items.map((it) => ({
    boxNo: it.boxNo,
    species: it.species,
    size: it.size ?? undefined,
    pieces: it.pieces ?? undefined,
    weightKg: it.weightKg ?? undefined,
    weightLb: it.weightLb ?? undefined,
  }));

  const totals = {
    kg: items.reduce((s, i) => s + (i.weightKg ?? 0), 0),
    lb: items.reduce((s, i) => s + (i.weightLb ?? 0), 0),
  };

  return {
    id: p.id,
    invoice: p.invoice,
    // convertimos Date -> string ISO para el front
    date: p.date ? p.date.toISOString().slice(0, 10) : undefined,
    customer: p.customer ?? undefined,
    vessel: p.vessel ?? undefined,
    status: (p.status as PackingStatus) ?? "draft",
    items,
    totals,
  };
}

/**
 * Verifica si una factura ya existe.
 * `excludeId` sirve cuando estás editando un packing existente.
 */
export async function isInvoiceDuplicate(
  invoice: string,
  excludeId?: string
) {
  const p = await prisma.packing.findUnique({
    where: { invoice },
    select: { id: true },
  });

  if (!p) return false;
  if (excludeId && p.id === excludeId) return false;
  return true;
}

/**
 * Crear o actualizar un packing completo (encabezado + items).
 */
export async function upsertPacking(payload: {
  id?: string;
  invoice: string;
  date?: string;
  customer?: string;
  vessel?: string;
  status?: PackingStatus;
  items: PackingItem[];
}) {
  // Normalizamos fecha (string -> Date | undefined)
  const dateValue = payload.date ? new Date(payload.date) : undefined;

  if (payload.id) {
    // UPDATE: reemplazamos todos los items por simplicidad
    await prisma.$transaction([
      prisma.packing.update({
        where: { id: payload.id },
        data: {
          invoice: payload.invoice,
          date: dateValue,
          customer: payload.customer,
          vessel: payload.vessel,
          status: payload.status,
        },
      }),
      prisma.packingItem.deleteMany({
        where: { packingId: payload.id },
      }),
      prisma.packingItem.createMany({
        data: payload.items.map((it) => ({
          packingId: payload.id!,          // string (uuid)
          boxNo: it.boxNo,
          species: it.species,
          size: it.size,
          pieces: it.pieces,
          weightKg: it.weightKg,
          weightLb: it.weightLb,
        })),
      }),
    ]);

    return { id: payload.id };
  }

  // CREATE
  const created = await prisma.packing.create({
    data: {
      invoice: payload.invoice,
      date: dateValue,
      customer: payload.customer,
      vessel: payload.vessel,
      status: payload.status,
      items: {
        create: payload.items.map((it) => ({
          boxNo: it.boxNo,
          species: it.species,
          size: it.size,
          pieces: it.pieces,
          weightKg: it.weightKg,
          weightLb: it.weightLb,
        })),
      },
    },
    select: { id: true },
  });

  return created; // { id: string }
}

