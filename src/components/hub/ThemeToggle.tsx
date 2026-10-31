"use client";

import { useState } from "react";
import { THEME_COOKIE, type HubTheme } from "@/lib/theme";
import Icon, { type IconName } from "./Icon";

const OPTIONS: { value: HubTheme; label: string; icon: IconName }[] = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "system", label: "Match device", icon: "monitor" }
];

// Saves the choice for a year and repaints the hub straight away (no reload).
function applyTheme(value: HubTheme) {
  document.cookie = `${THEME_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
  document.querySelectorAll<HTMLElement>(".app").forEach(app => { app.dataset.theme = value; });
}

/** Light / dark / match-device switch. */
export default function ThemeToggle({ initial }: { initial: HubTheme }) {
  const [theme, setTheme] = useState(initial);

  function choose(value: HubTheme) {
    setTheme(value);
    applyTheme(value);
  }

  return (
    <div className="theme-toggle" role="radiogroup" aria-label="Appearance">
      {OPTIONS.map(option => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={theme === option.value}
          className={theme === option.value ? "active" : ""}
          onClick={() => choose(option.value)}
          title={option.label}
          aria-label={option.label}
        >
          <Icon name={option.icon} size={15} />
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
