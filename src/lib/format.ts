export const BRAND_NAME = "Browne's Talent Group";

export function money(value: number, decimals = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

export function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function shortDate(value: string | Date, withYear = false) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {})
  });
}
