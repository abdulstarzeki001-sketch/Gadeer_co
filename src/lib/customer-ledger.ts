/** Customer receivables: invoices add debt; money received reduces it. */
export function isDebtIncrease(type: string): boolean {
  const normalized = (type || "").trim().toLowerCase();
  // Load receipts represent charges, despite containing the word "receipt".
  if (["charge", "income", "turkish_load_receipt"].includes(normalized)) return true;
  if (["payment", "receipt", "deposit", "قبض", "تحصيل", "دائن", "ايداع", "إيداع"].some(token => normalized.includes(token))) return false;
  // Retain the interpretation of other legacy transaction categories.
  return ["credit", "income", "وارد"].some(token => normalized.includes(token));
}

export function ledgerAmount(amount: number | string): number {
  const value = Number(amount);
  return Number.isFinite(value) ? Math.abs(value) : 0;
}

export function customerBalance(items: readonly { type: string; amount: number | string }[]): number {
  return items.reduce((cents, item) => cents + (isDebtIncrease(item.type) ? 1 : -1) * Math.round(ledgerAmount(item.amount) * 100), 0) / 100;
}
