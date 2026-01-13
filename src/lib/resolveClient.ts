// src/lib/resolveClient.ts
import { catalogs } from "@/lib/loadCatalogs";

export function resolveClientName(code?: string) {
  if (!code) return "";
  const c = catalogs.clients.find(
    (x: any) => x.code === code
  );
  return c ? c.name : code;
}
