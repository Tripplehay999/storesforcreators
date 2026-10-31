// Creator hub colour theme, remembered in a cookie so the server renders the right one (no flash).
export type HubTheme = "light" | "dark" | "system";

export const THEME_COOKIE = "sfc-hub-theme";

export function parseTheme(value: string | undefined): HubTheme {
  return value === "light" || value === "dark" ? value : "system";
}
