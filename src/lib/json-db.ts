// src/lib/json-db.ts
import { promises as fs } from "fs";
import path from "path";

// Siempre apunta a /data (RAÍZ DEL PROYECTO)
function resolveDataPath(file: string) {
  return path.join(process.cwd(), "data", file);
}

export async function readJson<T = any>(file: string, fallback: T): Promise<T> {
  try {
    const fullPath = resolveDataPath(file);
    const content = await fs.readFile(fullPath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(file: string, data: any): Promise<void> {
  const fullPath = resolveDataPath(file);
  await fs.writeFile(fullPath, JSON.stringify(data, null, 2), "utf8");
}


