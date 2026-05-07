import {
  DEFAULT_THEME_PREFERENCES,
  normalizarPreferenciasTema,
  THEME_STORAGE_KEY,
} from "./constants";
import type { PreferenciasTema } from "./types";

function getTemaEfetivo(temaPreferido: PreferenciasTema["tema_preferido"]) {
  if (temaPreferido !== "system") {
    return temaPreferido;
  }

  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

export function applyTheme(
  preferencias: Partial<PreferenciasTema> | null | undefined
) {
  if (typeof document === "undefined") {
    return DEFAULT_THEME_PREFERENCES;
  }

  const preferenciasNormalizadas = normalizarPreferenciasTema(preferencias);
  const root = document.documentElement;

  root.dataset.theme = preferenciasNormalizadas.tema_preferido;
  root.dataset.themeEffective = getTemaEfetivo(
    preferenciasNormalizadas.tema_preferido
  );
  root.dataset.accent = preferenciasNormalizadas.cor_preferida;
  root.dataset.fontScale = preferenciasNormalizadas.fonte_escala;

  return preferenciasNormalizadas;
}

export function readStoredTheme(fallback = DEFAULT_THEME_PREFERENCES) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return raw ? normalizarPreferenciasTema(JSON.parse(raw)) : fallback;
  } catch {
    return fallback;
  }
}

export function persistTheme(preferencias: PreferenciasTema) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    THEME_STORAGE_KEY,
    JSON.stringify(normalizarPreferenciasTema(preferencias))
  );
}
