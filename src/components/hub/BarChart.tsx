"use client";

import { useState } from "react";

export type ChartBucket = { label: string; tooltip: string; values: Record<string, number> };
export type ChartMetric = { key: string; label: string; unit: string; kind: "money" | "count" };

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

function readout(metric: ChartMetric, value: number) {
  return metric.kind === "money"
    ? `${fullMoney(value)} ${metric.unit}`
    : `${Math.round(value).toLocaleString("en-US")} ${value === 1 ? metric.unit.replace(/s$/, "") : metric.unit}`;
}

/** Bar chart with a metric switch and hover/tap details for each bar. */
export default function BarChart({ buckets, metrics }: { buckets: ChartBucket[]; metrics: ChartMetric[] }) {
  const [metricKey, setMetricKey] = useState(metrics[0].key);
  const [active, setActive] = useState<number | null>(null);
  const metric = metrics.find(item => item.key === metricKey) ?? metrics[0];

  const values = buckets.map(bucket => bucket.values[metric.key] ?? 0);
  const max = Math.max(...values, 0);
  const isMoney = metric.kind === "money";
  const step = max === 0 ? (isMoney ? 25 : 1) : niceStep(max / 4);
  const top = Math.max(step * 4, isMoney ? 0 : 4);
  const ticks = [4, 3, 2, 1, 0].map(index => (top / 4) * index);
  // Keep x-axis labels readable: about 7 across, evenly spaced back from the latest bucket.
  const every = Math.ceil(buckets.length / 7);
  const labelled = (index: number) => (buckets.length - 1 - index) % every === 0;
  const format = (value: number) => (isMoney ? compactMoney(value) : String(Math.round(value)));
  const describe = (bucket: ChartBucket) => metrics.map(item => readout(item, bucket.values[item.key] ?? 0)).join(", ");

  return (
    <div className="chart">
      <div className="chart-toolbar">
        {metrics.length > 1 ? (
          <div className="segmented segmented-sm" role="tablist" aria-label="Chart metric">
            {metrics.map(item => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={metric.key === item.key}
                className={metric.key === item.key ? "active" : ""}
                onClick={() => setMetricKey(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : <span />}

        <p className="chart-readout" aria-live="polite">
          {active === null ? (
            <span className="muted">Select a bar for its details</span>
          ) : (
            <>
              <strong>{buckets[active].tooltip}</strong>
              {metrics.map(item => <span key={item.key}>{readout(item, buckets[active].values[item.key] ?? 0)}</span>)}
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
            const value = bucket.values[metric.key] ?? 0;
            return (
              <button
                key={bucket.tooltip}
                type="button"
                className={`chart-col${active === index ? " active" : ""}`}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(current => (current === index ? null : index))}
                aria-label={`${bucket.tooltip}: ${describe(bucket)}`}
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
