"use client";

import { useState } from "react";
import type { Bucket } from "@/lib/stats";

type Metric = "earnings" | "orders";

function niceStep(raw: number) {
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].find(factor => factor * magnitude >= raw) ?? 10;
  return step * magnitude;
}

function compactMoney(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return `$${Math.round(value)}`;
}

function fullMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

/** Bar chart of earnings or orders per bucket, with hover/tap details. */
export default function EarningsChart({ buckets }: { buckets: Bucket[] }) {
  const [metric, setMetric] = useState<Metric>("earnings");
  const [active, setActive] = useState<number | null>(null);

  const values = buckets.map(bucket => bucket[metric]);
  const max = Math.max(...values, 0);
  const step = max === 0 ? (metric === "orders" ? 1 : 25) : niceStep(max / 4);
  const top = Math.max(step * 4, metric === "orders" ? 4 : 0);
  const ticks = [4, 3, 2, 1, 0].map(index => (top / 4) * index);
  // Keep x-axis labels readable: about 7 across, evenly spaced back from the latest bucket.
  const every = Math.ceil(buckets.length / 7);
  const labelled = (index: number) => (buckets.length - 1 - index) % every === 0;
  const format = (value: number) => (metric === "earnings" ? compactMoney(value) : String(Math.round(value)));

  return (
    <div className="chart">
      <div className="chart-toolbar">
        <div className="segmented segmented-sm" role="tablist" aria-label="Chart metric">
          {(["earnings", "orders"] as Metric[]).map(value => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={metric === value}
              className={metric === value ? "active" : ""}
              onClick={() => setMetric(value)}
            >
              {value === "earnings" ? "Your earnings" : "Orders"}
            </button>
          ))}
        </div>

        <p className="chart-readout" aria-live="polite">
          {active === null ? (
            <span className="muted">Select a bar for its details</span>
          ) : (
            <>
              <strong>{buckets[active].tooltip}</strong>
              <span>{fullMoney(buckets[active].earnings)} earned</span>
              <span>{buckets[active].orders} order{buckets[active].orders === 1 ? "" : "s"}</span>
            </>
          )}
        </p>
      </div>

      <div className="chart-plot" onMouseLeave={() => setActive(null)}>
        <div className="chart-grid" aria-hidden="true">
          {ticks.map(tick => (
            <div key={tick}>
              <span>{format(tick)}</span>
            </div>
          ))}
        </div>

        <div className="chart-bars" style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }}>
          {buckets.map((bucket, index) => {
            const value = bucket[metric];
            return (
              <button
                key={bucket.tooltip}
                type="button"
                className={`chart-col${active === index ? " active" : ""}`}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(current => (current === index ? null : index))}
                aria-label={`${bucket.tooltip}: ${fullMoney(bucket.earnings)} earned, ${bucket.orders} orders`}
              >
                <span
                  className={`chart-bar${value === 0 ? " is-zero" : ""}`}
                  style={{ height: value === 0 ? undefined : `${Math.max(2, (value / top) * 100)}%` }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="chart-axis" style={{ gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))` }} aria-hidden="true">
        {buckets.map((bucket, index) => (
          <span key={bucket.tooltip}>{labelled(index) ? bucket.label : ""}</span>
        ))}
      </div>
    </div>
  );
}
