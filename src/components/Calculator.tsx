"use client";

import { useState, type CSSProperties } from "react";
import { money, number } from "@/lib/format";

type Values = {
  followers: number;
  reach: number;
  rate: number;
  price: number;
  split: number;
};

const sliders: {
  key: keyof Values;
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
}[] = [
  { key: "followers", id: "calc-followers", label: "TikTok followers", min: 5000, max: 1000000, step: 5000, format: number },
  { key: "reach", id: "calc-reach", label: "Monthly store visitors as % of followers", min: 1, max: 30, step: 0.5, format: v => v.toFixed(1) + "%" },
  { key: "rate", id: "calc-rate", label: "Visitors who purchase", min: 0.5, max: 10, step: 0.5, format: v => v.toFixed(1) + "%" },
  { key: "price", id: "calc-price", label: "Average order value", min: 9, max: 109, step: 1, format: v => money(v) },
  { key: "split", id: "calc-split", label: "Your creator share", min: 50, max: 80, step: 5, format: v => Math.round(v) + "%" }
];

const presets = [25000, 50000, 100000, 250000, 500000];

export default function Calculator() {
  const [values, setValues] = useState<Values>({
    followers: 25000,
    reach: 12,
    rate: 3.5,
    price: 29,
    split: 50
  });

  const split = values.split / 100;
  const visits = Math.round(values.followers * values.reach / 100);
  const orders = Math.round(visits * values.rate / 100);
  const gross = orders * values.price;
  const creatorCut = gross * split;
  const btgCut = gross * (1 - split);

  const scenarios = [
    { key: "low", label: "LOWER", factor: 0.6 },
    { key: "mid", label: "SELECTED", factor: 1 },
    { key: "high", label: "HIGHER", factor: 1.4 }
  ].map(scenario => {
    const scenarioOrders = Math.round(Math.round(visits * scenario.factor) * values.rate / 100);
    return { ...scenario, earnings: scenarioOrders * values.price * split };
  });

  const maximum = Math.max(1, ...scenarios.map(scenario => scenario.earnings));

  const set = (key: keyof Values, value: number) =>
    setValues(current => ({ ...current, [key]: value }));

  return (
    <div className="calculator-layout">
      <div className="calculator-controls reveal">
        <div className="calculator-intro">
          <span className="calculator-sparkle">✳</span>
          <div>
            <h3>Let&apos;s do the numbers.</h3>
            <p>Start with your TikTok following.</p>
          </div>
        </div>

        {sliders.map(slider => {
          const value = values[slider.key];
          const progress = (value - slider.min) / (slider.max - slider.min) * 100;

          return (
            <div className="slider-group" key={slider.key}>
              <div className="slider-heading">
                <label htmlFor={slider.id}>{slider.label}</label>
                <strong>{slider.format(value)}</strong>
              </div>

              <input
                id={slider.id}
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={value}
                style={{ "--progress": `${progress}%` } as CSSProperties}
                onChange={event => set(slider.key, Number(event.target.value))}
              />

              {slider.key === "followers" && (
                <div className="slider-presets">
                  {presets.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      className={values.followers === preset ? "active" : ""}
                      aria-pressed={values.followers === preset}
                      onClick={() => set("followers", preset)}
                    >
                      {preset / 1000}K
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <p className="calculator-disclaimer">
          Illustrative model only. Follower count does not predict traffic
          or sales. These are adjustable assumptions, not actual or
          typical earnings.
        </p>
      </div>

      <div className="calculator-results reveal">
        <div className="results-header">
          <span>✳ YOUR EARNINGS ESTIMATE</span>
          <span>USD / MONTH</span>
        </div>

        <div className="results-main">
          <span>YOUR MONTHLY CUT</span>
          <strong>{money(creatorCut, 2)}</strong>
          <p>Hypothetical monthly creator earnings at your selected assumptions.</p>
        </div>

        <div className="result-stat-grid">
          <div>
            <small>STORE VISITS</small>
            <strong>{number(visits)}</strong>
          </div>
          <div>
            <small>ORDERS</small>
            <strong>{number(orders)}</strong>
          </div>
          <div>
            <small>GROSS SALES</small>
            <strong>{money(gross, 2)}</strong>
          </div>
          <div>
            <small>BTG SHARE</small>
            <strong>{money(btgCut, 2)}</strong>
          </div>
        </div>

        <div className="scenario-chart">
          <div className="scenario-heading">
            <strong>Explore different scenarios</strong>
            <small>LOWER / SELECTED / HIGHER TRAFFIC</small>
          </div>

          <div className="scenario-bars">
            {scenarios.map(scenario => (
              <div className="scenario-item" key={scenario.key}>
                <strong>{money(scenario.earnings, 2)}</strong>
                <div className="scenario-track">
                  <span style={{ height: `${scenario.earnings / maximum * 100}%` }} />
                </div>
                <small>{scenario.label}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="results-cta">
          <button className="btn btn-lime" data-apply>Build my own store ↗</button>
          <small>NO UPFRONT STORE SETUP FEE ✳</small>
        </div>
      </div>
    </div>
  );
}
