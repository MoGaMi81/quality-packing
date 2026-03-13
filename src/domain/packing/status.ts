// ============================================================
// PACKING STATUS
// ============================================================

export const PACKING_STATUS = {
  DRAFT: "DRAFT",
  READY: "READY",
} as const;


// ============================================================
// PRICING STATUS
// ============================================================

export const PRICING_STATUS = {
  PENDING: "PENDING",
  DONE: "DONE",
} as const;


// ============================================================
// HELPERS
// ============================================================

export function canEditPricing(status: string) {
  return ["READY", "PRICED"].includes(status);
}

export function isPricingPending(pricing_status: string) {
  return pricing_status === PRICING_STATUS.PENDING;
}