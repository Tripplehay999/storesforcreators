"use client";

import { useState } from "react";
import { money } from "@/lib/format";

// Figures for the landing-page preview; mirrors the layout of the real creator hub.
const SAMPLE = {
  month: {
    label: "Last 30 days",
    earnings: 1761.5,
    orders: 71,
    change: 41,
    bars: [3, 5, 2, 4, 6, 3, 2, 5, 7, 4, 6, 8, 5, 3, 6, 9, 7, 5, 8, 6, 10, 7, 9, 6, 8, 11, 9, 7, 10, 12]
  },
  year: {
    label: "Last 12 months",
    earnings: 13500.5,
    orders: 510,
    change: 64,
    bars: [12, 15, 14, 18, 21, 19, 24, 27, 26, 31, 35, 38]
  }
};

const ORDERS = [
  ["Budget Planner Collection", "Today", 29.5],
  ["1:1 Financial Coaching", "Yesterday", 52.5],
  ["Budget Planner Collection", "Oct 29", 19.5]
] as const;

export default function DashboardPreview() {
  const [period, setPeriod] = useState<keyof typeof SAMPLE>("month");
  const data = SAMPLE[period];
  const max = Math.max(...data.bars);

  return (
    <div className="dp" aria-label="Creator hub preview">
      <div className="dp-top">
        <div>
          <strong>Good afternoon, Jasmine</strong>
          <span>{data.label}</span>
        </div>
        <div className="dp-toggle" role="group" aria-label="Date range">
          <button type="button" className={period === "month" ? "active" : ""} aria-pressed={period === "month"} onClick={() => setPeriod("month")}>30D</button>
          <button type="button" className={period === "year" ? "active" : ""} aria-pressed={period === "year"} onClick={() => setPeriod("year")}>12M</button>
        </div>
      </div>

      <div className="dp-stats">
        <div>
          <small>Your earnings</small>
          <strong>{money(data.earnings, 2)}</strong>
          <span className="dp-delta">+{data.change}%</span>
        </div>
        <div>
          <small>Orders</small>
          <strong>{data.orders}</strong>
          <span className="dp-delta">+{Math.round(data.change * 1.2)}%</span>
        </div>
      </div>

      <div className="dp-chart" aria-hidden="true">
        {data.bars.map((value, index) => (
          <span key={`${period}-${index}`} style={{ height: `${(value / max) * 100}%` }} />
        ))}
      </div>

      <ul className="dp-orders">
        {ORDERS.map(([name, when, share]) => (
          <li key={`${name}-${when}`}>
            <div>
              <strong>{name}</strong>
              <span>{when}</span>
            </div>
            <b>+{money(share, 2)}</b>
          </li>
        ))}
      </ul>

      <p className="dp-note">Preview</p>
    </div>
  );
}
