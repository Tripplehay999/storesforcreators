export const BRAND_NAME = "Stores for Creators";

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

// Dates are shown and bucketed (days, weeks, months) in the business's timezone,
// not the server's — Vercel runs in UTC, which would push evening orders into tomorrow.
export const TIME_ZONE = process.env.NEXT_PUBLIC_TIME_ZONE || "America/Toronto";

const zoneParts = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric"
});

/** Calendar date in TIME_ZONE. `month` is 0-based, like Date#getMonth. */
export function zonedDate(value: string | Date) {
  const parts = zoneParts.formatToParts(new Date(value));
  const get = (type: string) => Number(parts.find(part => part.type === type)?.value);

  return { year: get("year"), month: get("month") - 1, day: get("day") };
}

/** A Date that falls on the given calendar day in TIME_ZONE (noon UTC, so any US zone agrees). */
export function calendarDay(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day, 12));
}

export function shortDate(value: string | Date, withYear = false) {
  return new Date(value).toLocaleDateString("en-US", {
    timeZone: TIME_ZONE,
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {})
  });
}

/** How far TIME_ZONE is ahead of UTC at a given moment, in milliseconds. */
function zoneOffset(at: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric"
    }).formatToParts(at).map(part => [part.type, Number(part.value)])
  );
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - at.getTime();
}

/** 23:59:59 on a "YYYY-MM-DD" date in TIME_ZONE, e.g. for "ends on" dates. Null if the date is invalid. */
export function endOfDayInZone(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const guess = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 23, 59, 59);
  return new Date(guess - zoneOffset(new Date(guess)));
}
