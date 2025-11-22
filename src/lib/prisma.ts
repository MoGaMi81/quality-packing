import { PrismaClient } from "@prisma/client";

// Extiende el tipo de globalThis para permitir prisma
declare global {
  // solo en desarrollo
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
