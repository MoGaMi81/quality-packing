// src/lib/json-db.ts
import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src", "data");

export async function readJson<T=any>(fileName: string, fallback: T): Promise<T> {
  try {
    const p = path.join(DATA_DIR, fileName);
    const raw = await fs.readFile(p, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(fileName: string, data: any) {
  const p = path.join(DATA_DIR, fileName);
  await fs.writeFile(p, JSON.stringify(data, null, 2), "utf8");
}
