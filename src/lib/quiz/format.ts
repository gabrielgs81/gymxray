export const brl = (v: number | null, digits = 0) =>
  v === null
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(v);

export const pct = (v: number | null, digits = 1) =>
  v === null ? "—" : `${(v * 100).toFixed(digits).replace(".", ",")}%`;

export const int = (v: number | null) =>
  v === null ? "—" : new Intl.NumberFormat("pt-BR").format(Math.round(v));

export const dec = (v: number | null, digits = 1) =>
  v === null ? "—" : v.toFixed(digits).replace(".", ",");

/** "1234,5" -> 1234.5 ; aceita digitação livre em pt-BR */
export function parseCurrencyInput(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  return Number(digits) / 100;
}

export function formatCurrencyInput(value: number | null): string {
  if (value === null) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
