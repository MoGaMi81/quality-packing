// src/lib/json-db.ts
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data"); // <--- CORRECTO

export async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const full = path.join(DATA_DIR, file);
    const txt = await fs.readFile(full, "utf8");
    return JSON.parse(txt);
  } catch {
    return fallback;
  }
}

export async function writeJson(file: string, data: any) {
  const full = path.join(DATA_DIR, file);
  await fs.writeFile(full, JSON.stringify(data, null, 2), "utf8");
}

