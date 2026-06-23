const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const num = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const fmtMoney = (n: number | string | null | undefined) =>
  usd.format(Number(n) || 0);

export const fmtNumber = (n: number | string | null | undefined) =>
  num.format(Number(n) || 0);

export const fmtDate = (iso: string | Date) =>
  new Date(iso).toLocaleDateString("en-GB");