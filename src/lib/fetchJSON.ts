// src/lib/fetchJSON.ts
export async function fetchJSON<T = any>(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<T> {
  const r = await fetch(input, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!r.ok) {
    let msg = "";
    try {
      msg = await r.text();
    } catch {}
    throw new Error(msg || `HTTP ${r.status}`);
  }

  return r.json() as Promise<T>;
}
