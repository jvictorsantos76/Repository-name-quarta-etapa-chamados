import type {
  CorPreferida,
  FonteEscala,
  PreferenciasTema,
  TemaPreferido,
} from "./types";

export const THEME_STORAGE_KEY = "quarta-etapa-theme-preferences";

export const DEFAULT_THEME_PREFERENCES: PreferenciasTema = {
  tema_preferido: "system",
  cor_preferida: "quarta-etapa",
  fonte_escala: "padrao",
};

export const TEMAS_VALIDOS: TemaPreferido[] = ["system", "light", "dark"];

export const CORES_VALIDAS: CorPreferida[] = [
  "quarta-etapa",
  "verde",
  "roxo",
  "laranja",
  "neutro",
];

export const FONTES_VALIDAS: FonteEscala[] = [
  "padrao",
  "grande",
  "extra_grande",
];

export function isTemaPreferido(valor: string): valor is TemaPreferido {
  return TEMAS_VALIDOS.includes(valor as TemaPreferido);
}

export function isCorPreferida(valor: string): valor is CorPreferida {
  return CORES_VALIDAS.includes(valor as CorPreferida);
}

export function isFonteEscala(valor: string): valor is FonteEscala {
  return FONTES_VALIDAS.includes(valor as FonteEscala);
}

export function normalizarPreferenciasTema(
  preferencias: Partial<PreferenciasTema> | null | undefined
): PreferenciasTema {
  return {
    tema_preferido:
      preferencias?.tema_preferido && isTemaPreferido(preferencias.tema_preferido)
        ? preferencias.tema_preferido
        : DEFAULT_THEME_PREFERENCES.tema_preferido,
    cor_preferida:
      preferencias?.cor_preferida && isCorPreferida(preferencias.cor_preferida)
        ? preferencias.cor_preferida
        : DEFAULT_THEME_PREFERENCES.cor_preferida,
    fonte_escala:
      preferencias?.fonte_escala && isFonteEscala(preferencias.fonte_escala)
        ? preferencias.fonte_escala
        : DEFAULT_THEME_PREFERENCES.fonte_escala,
  };
}

export const THEME_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var storageKey = "${THEME_STORAGE_KEY}";
    var root = document.documentElement;
    var defaults = {
      tema_preferido: root.dataset.theme || "${DEFAULT_THEME_PREFERENCES.tema_preferido}",
      cor_preferida: root.dataset.accent || "${DEFAULT_THEME_PREFERENCES.cor_preferida}",
      fonte_escala: root.dataset.fontScale || "${DEFAULT_THEME_PREFERENCES.fonte_escala}"
    };
    var raw = window.localStorage.getItem(storageKey);
    var parsed = raw ? JSON.parse(raw) : {};
    var preferences = {
      tema_preferido: ["system", "light", "dark"].indexOf(parsed.tema_preferido) >= 0 ? parsed.tema_preferido : defaults.tema_preferido,
      cor_preferida: ["quarta-etapa", "verde", "roxo", "laranja", "neutro"].indexOf(parsed.cor_preferida) >= 0 ? parsed.cor_preferida : defaults.cor_preferida,
      fonte_escala: ["padrao", "grande", "extra_grande"].indexOf(parsed.fonte_escala) >= 0 ? parsed.fonte_escala : defaults.fonte_escala
    };
    var effectiveTheme = preferences.tema_preferido === "system"
      ? (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : preferences.tema_preferido;

    root.dataset.theme = preferences.tema_preferido;
    root.dataset.themeEffective = effectiveTheme;
    root.dataset.accent = preferences.cor_preferida;
    root.dataset.fontScale = preferences.fonte_escala;
  } catch (error) {
    document.documentElement.dataset.theme = "system";
    document.documentElement.dataset.themeEffective = "light";
    document.documentElement.dataset.accent = "quarta-etapa";
    document.documentElement.dataset.fontScale = "padrao";
  }
})();
`;
