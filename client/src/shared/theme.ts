export const THEME_STORAGE_KEY = "cstp.ui.theme";

export type UiTheme = "light" | "dark";

export function isUiTheme(value: string): value is UiTheme {
  return value === "light" || value === "dark";
}

/** Update `<html data-theme>` only (no localStorage). */
export function setUiThemeLive(theme: UiTheme): void {
  document.documentElement.dataset.theme = theme;
}

/** Apply theme to `<html>` and cache for login screen before settings load. */
export function setUiTheme(theme: UiTheme): void {
  setUiThemeLive(theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore quota / private mode */
  }
}

/** Read last saved theme from cache (no network). */
export function readCachedUiTheme(): UiTheme | null {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw && isUiTheme(raw) ? raw : null;
  } catch {
    return null;
  }
}

/** Run once at startup: paint cached theme or default light. */
export function hydrateThemeFromCache(): void {
  if (typeof document === "undefined") return;
  const cached = readCachedUiTheme();
  setUiTheme(cached ?? "light");
}
