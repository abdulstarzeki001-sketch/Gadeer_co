import { isDebtIncrease } from "./customer-ledger.ts";

export type StatementTransaction = {
  id: string; type: string; amount: number; created_at: string;
  document_id: string | null; document_number: string | null;
  driver_name: string | null; cargo_typedetails?: string | null; description: string | null;
};
export type StatementDocument = {
  id: string; company_name: string; company_name_project: string | null;
  driver_name: string | null; vehicle_number: string | null; cargo_typedetails: string | null;
};
export function readDetails(value: string | null): Record<string, unknown> {
  try {
    const data: unknown = JSON.parse(value || "");
    return data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {};
  } catch { return {}; }
}
export function detailText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
export function collectionDescription(value: string | null): string {
  const details = readDetails(value);
  return details.collection_receipt === true
    ? [detailText(details.senderName), detailText(details.paymentMethod), detailText(details.note)].filter(Boolean).join(" — ") || "—"
    : value || "—";
}
/** Collections are stored in IQD; legacy dues and other receipts remain USD. */
export const IQD_PER_USD = 1530;
export function isIqdCollection(type: string): boolean { return type.trim() === "تحصيل من عميل"; }
export function amountInUsd(type: string, amount: number): number {
  return isIqdCollection(type) ? amount / IQD_PER_USD : amount;
}
export function buildCustomerStatement(items: readonly StatementTransaction[], documents: readonly StatementDocument[] = []) {
  const docs = new Map(documents.map(item => [item.id, item]));
  const sorted = [...items].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  const dues = [];
  const receipts = [];
  let dueCents = 0;
  let legacyReceiptCents = 0;
  let receiptIqdCents = 0;
  for (const item of sorted) {
    const value = Number(item.amount);
    if (!Number.isFinite(value)) throw new Error("توجد حركة بمبلغ غير صالح؛ صحّحها قبل إصدار الكشف.");
    const cents = Math.round(Math.abs(value) * 100);
    if (!Number.isSafeInteger(cents)) throw new Error("مبلغ الحركة يتجاوز الحد الآمن للحساب.");
    const details = readDetails(item.description);
    const doc = item.document_id ? docs.get(item.document_id) : undefined;
    const common = { id: item.id, date: item.created_at, amount: cents / 100 };
    if (isDebtIncrease(item.type)) {
      dueCents += cents;
      dues.push({
        ...common, number: item.document_number || "—",
        driver: item.driver_name || doc?.driver_name || detailText(details.driverName) || "—",
        vehicle: doc?.vehicle_number || detailText(details.vehicleNumber) || "—",
        company: doc?.company_name_project || doc?.company_name || detailText(details.companyName) || "—",
        description: item.cargo_typedetails || doc?.cargo_typedetails || detailText(details.cargoType) || detailText(details.service) || (Object.keys(details).length ? detailText(details.note) : item.description) || "—",
      });
    } else {
      const iqd = isIqdCollection(item.type);
      if (iqd) receiptIqdCents += cents;
      else legacyReceiptCents += cents;
      receipts.push({
        ...common, currency: isIqdCollection(item.type) ? "IQD" : "USD", sender: detailText(details.senderName) || "—",
        method: detailText(details.paymentMethod) || "—",
        note: Object.keys(details).length ? detailText(details.note) : item.description || "",
      });
    }
  }
  // Convert the IQD grand total once, rather than rounding each receipt in USD.
  const receiptIqdTotal = receiptIqdCents / 100;
  const receiptTotal = Math.round((legacyReceiptCents / 100 + receiptIqdTotal / IQD_PER_USD) * 100) / 100;
  const balance = Math.round((dueCents / 100 - receiptTotal) * 100) / 100;
  if (![dueCents, legacyReceiptCents, receiptIqdCents].every(Number.isSafeInteger)) throw new Error("إجمالي الحركات يتجاوز الحد الآمن للحساب.");
  return { dues, receipts, dueTotal: dueCents / 100, receiptTotal, receiptIqdTotal, balance };
}
