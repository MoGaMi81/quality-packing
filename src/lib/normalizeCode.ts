export function normalizeCode(code: string) {
  return code
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "");
}
