import { calendarDay, shortDate, zonedDate } from "./format";
import type { Order } from "./types";

export type Range = "7d" | "30d" | "90d" | "12m";

export const RANGES: { value: Range; label: string; long: string }[] = [
  { value: "7d", label: "7D", long: "Last 7 days" },
  { value: "30d", label: "30D", long: "Last 30 days" },
  { value: "90d", label: "90D", long: "Last 90 days" },
  { value: "12m", label: "12M", long: "Last 12 months" }
];

export function parseRange(value?: string): Range {
  return RANGES.find(range => range.value === value)?.value ?? "30d";
}

export type Totals = { earnings: number; sales: number; orders: number };

export type Bucket = Totals & { label: string; tooltip: string };

export type RangeSummary = {
  current: Totals;
  previous: Totals;
  buckets: Bucket[];
  products: { name: string; orders: number; earnings: number }[];
};

const DAY = 86400000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Days and weeks are counted back from today; 90D is shown as 13 weekly bars.
const SPANS: Record<Exclude<Range, "12m">, { days: number; perBucket: number }> = {
  "7d": { days: 7, perBucket: 1 },
  "30d": { days: 30, perBucket: 1 },
  "90d": { days: 91, perBucket: 7 }
};

function dayNumber(value: string | Date) {
  const { year, month, day } = zonedDate(value);
  return Math.round(calendarDay(year, month, day).getTime() / DAY);
}

function empty(): Totals {
  return { earnings: 0, sales: 0, orders: 0 };
}

function add(totals: Totals, order: Order) {
  totals.earnings += order.creatorAmount;
  totals.sales += order.amount;
  totals.orders += 1;
}

/** The earliest moment `summarize` needs orders from: the start of the previous period, plus a day of slack. */
export function rangeStart(range: Range, now = new Date()) {
  const today = zonedDate(now);

  if (range === "12m") return calendarDay(today.year, today.month - 23, 0);
  return calendarDay(today.year, today.month, today.day - SPANS[range].days * 2);
}

/** Totals for the range and the period before it, chart buckets, and top products. Refunds are excluded. */
export function summarize(orders: Order[], range: Range, now = new Date()): RangeSummary {
  const today = zonedDate(now);
  const current = empty();
  const previous = empty();
  const products = new Map<string, { name: string; orders: number; earnings: number }>();
  let buckets: Bucket[];
  let place: (order: Order) => "current" | "previous" | null;
  let bucketOf: (order: Order) => number;

  if (range === "12m") {
    const monthsAgo = (order: Order) => {
      const date = zonedDate(order.createdAt);
      return (today.year - date.year) * 12 + today.month - date.month;
    };

    buckets = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(Date.UTC(today.year, today.month - 11 + index, 1));
      const month = date.getUTCMonth();
      return { ...empty(), label: MONTHS[month], tooltip: `${MONTHS_LONG[month]} ${date.getUTCFullYear()}` };
    });
    place = order => {
      const ago = monthsAgo(order);
      return ago < 0 ? null : ago < 12 ? "current" : ago < 24 ? "previous" : null;
    };
    bucketOf = order => 11 - monthsAgo(order);
  } else {
    const { days, perBucket } = SPANS[range];
    const count = days / perBucket;
    const todayNumber = dayNumber(now);
    const daysAgo = (order: Order) => todayNumber - dayNumber(order.createdAt);
    const dayAt = (ago: number) => calendarDay(today.year, today.month, today.day - ago);

    buckets = Array.from({ length: count }, (_, index) => {
      const lastAgo = (count - 1 - index) * perBucket;
      const first = dayAt(lastAgo + perBucket - 1);
      const label = shortDate(first);
      return {
        ...empty(),
        label,
        tooltip: perBucket === 1 ? shortDate(first, true) : `${label} – ${shortDate(dayAt(lastAgo))}`
      };
    });
    place = order => {
      const ago = daysAgo(order);
      return ago < 0 ? null : ago < days ? "current" : ago < days * 2 ? "previous" : null;
    };
    bucketOf = order => count - 1 - Math.floor(daysAgo(order) / perBucket);
  }

  orders
    .filter(order => order.status === "completed")
    .forEach(order => {
      const period = place(order);

      if (period === "previous") add(previous, order);
      if (period !== "current") return;

      add(current, order);
      add(buckets[bucketOf(order)], order);

      const key = order.productId ?? order.productName;
      const product = products.get(key) ?? { name: order.productName, orders: 0, earnings: 0 };
      product.orders += 1;
      product.earnings += order.creatorAmount;
      products.set(key, product);
    });

  return {
    current,
    previous,
    buckets,
    products: [...products.values()].sort((a, b) => b.earnings - a.earnings).slice(0, 5)
  };
}

/** Percent change from `previous` to `current`, or null when there's nothing to compare against. */
export function change(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
