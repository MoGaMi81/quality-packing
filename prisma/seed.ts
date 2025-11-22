// prisma/seed.ts (rápido)
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function run() {
  const p = await prisma.packing.upsert({
    where: { invoice: "INV-1001" },
    update: {},
    create: {
      invoice: "INV-1001",
      date: "2025-11-06",
      customer: "Seafoods Inc.",
      vessel: "Blue Star",
      status: "final",
      items: {
        create: [
          { boxNo: 1, species: "RED SNAPPER", size: "2-4", pieces: 10, weightKg: 15.2, weightLb: 33.5 },
          { boxNo: 2, species: "GROUPER",    size: "4-6", pieces:  8, weightKg: 12.4, weightLb: 27.3 },
        ],
      },
    },
  });
  console.log("Seed:", p.invoice);
}
run().finally(() => prisma.$disconnect());
