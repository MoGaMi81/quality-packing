// src/domain/packing/families.ts

export function getFamilyKeyFromCode(code: string | null) {
  if (!code) return null;

  const prefix = code.substring(0, 2).toUpperCase();

  // Estas 4 familias usan precio único
  if (["BG", "GG", "FB", "SG"].includes(prefix)) {
    return "GROUPER_WG";
  }

  return null;
}
