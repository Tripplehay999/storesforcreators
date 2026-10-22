"use client";

import { useState } from "react";
import { money, number } from "@/lib/format";
import OrderBars from "./OrderBars";

const dashboardData = {
  weeks: {
    labels: ["W1", "W2", "W3", "W4"],
    orders: [5, 4, 7, 9],
    earnings: 612.5,
    title: "Weekly orders",
    note: "4-WEEK OVERVIEW"
  },
  months: {
    labels: ["JUL", "AUG", "SEP", "OCT"],
    orders: [12, 17, 18, 25],
    earnings: 1764,
    title: "Monthly orders",
    note: "LAST 4 MONTHS"
  }
};

type Period = keyof typeof dashboardData;

/** The illustrative "Creator hub" mock on the landing page. */
export default function DashboardPreview() {
  const [period, setPeriod] = useState<Period>("weeks");
  const data = dashboardData[period];

  return (
    <div className="dashboard-mock reveal">
      <div className="dash-top">
        <span>✳ JASMINE&apos;S FINANCIALS · CREATOR HUB</span>
        <span className="sample-badge">SAMPLE DATA</span>
      </div>

      <div className="dash-greeting">
        <div>
          <small>YOUR STORE / OVERVIEW</small>
          <h3>Your money, <em>your momentum.</em></h3>
          <p>Every order, every milestone, beautifully organized.</p>
        </div>

        <div className="dash-avatar">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=180&h=180&fit=crop&crop=faces"
            alt="Jasmine example creator profile photo"
          />
        </div>
      </div>

      <div className="dash-tabs">
        {([["weeks", "This month · by week"], ["months", "Last 4 months"]] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={period === key ? "active" : ""}
            aria-pressed={period === key}
            onClick={() => setPeriod(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="dash-metrics">
        <div className="dash-earnings">
          <small>YOUR CREATOR EARNINGS ✳</small>
          <strong>{money(data.earnings, 2)}</strong>
          <span>USD · illustrative creator share</span>
        </div>

        <div className="dash-orders">
          <small>PRODUCT ORDERS ↗</small>
          <strong>{number(data.orders.reduce((sum, value) => sum + value, 0))}</strong>
          <span>Example completed orders</span>
        </div>
      </div>

      <div className="dash-chart">
        <div className="dash-chart-heading">
          <div>
            <strong>{data.title}</strong>
            <small>{data.note}</small>
          </div>
          <span>EXAMPLE DATA</span>
        </div>

        <OrderBars labels={data.labels} orders={data.orders} />

        <small className="dash-chart-caption">
          Sample numbers for design demonstration only.
        </small>
      </div>

      <div className="dash-footer">
        <span>✳ EXAMPLE STOREFRONT</span>
        <span>CREATOR SHARE <strong>50%</strong></span>
      </div>
    </div>
  );
}
