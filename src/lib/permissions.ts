export function can(role: string | null, action: string) {
  if (!role) return false;

  const map: Record<string, string[]> = {
    admin: ["*"],
    proceso: ["create_packing", "edit_packing"],
    facturacion: ["assign_invoice", "finalize"],
  };

  const allowed = map[role] || [];

  return allowed.includes("*") || allowed.includes(action);
}