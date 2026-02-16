const THEME_KEY = "breaking-eternity-theme"

export type ThemeId =
  | "light"
  | "dark"
  | "vintage"
  | "terminal"
  | "nord"
  | "dracula"
  | "sepia"
  | "ocean"
  | "forest"
  | "sunset"
  | "rose"
  | "coffee"
  | "midnight"
  | "synthwave"
  | "lavender"
  | "mint"
  | "candy"
  | "crimson"
  | "peacock"
  | "desert"
  | "berry"
  | "sage"
  | "ink"
  | "honey"

const DEFAULT_THEME: ThemeId = "dark"

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: "light", label: "Claro" },
  { id: "dark", label: "Escuro" },
  { id: "vintage", label: "Vintage" },
  { id: "terminal", label: "Terminal" },
  { id: "nord", label: "Nord" },
  { id: "dracula", label: "Dracula" },
  { id: "sepia", label: "Sepia" },
  { id: "ocean", label: "Ocean" },
  { id: "forest", label: "Forest" },
  { id: "sunset", label: "Sunset" },
  { id: "rose", label: "Rose" },
  { id: "coffee", label: "Coffee" },
  { id: "midnight", label: "Midnight" },
  { id: "synthwave", label: "Synthwave" },
  { id: "lavender", label: "Lavender" },
  { id: "mint", label: "Mint" },
  { id: "candy", label: "Candy" },
  { id: "crimson", label: "Crimson" },
  { id: "peacock", label: "Peacock" },
  { id: "desert", label: "Desert" },
  { id: "berry", label: "Berry" },
  { id: "sage", label: "Sage" },
  { id: "ink", label: "Ink" },
  { id: "honey", label: "Honey" },
]

/** Cores principais para preview no seletor (background, superfície, primary, accent) */
export const THEME_PREVIEW_COLORS: Record<ThemeId, [string, string, string, string]> = {
  light: ["oklch(1 0 0)", "oklch(0.97 0 0)", "oklch(0.205 0 0)", "oklch(0.97 0 0)"],
  dark: ["oklch(0.145 0 0)", "oklch(0.205 0 0)", "oklch(0.922 0 0)", "oklch(0.269 0 0)"],
  vintage: ["oklch(0.22 0.04 55)", "oklch(0.28 0.05 60)", "oklch(0.75 0.15 75)", "oklch(0.38 0.08 70)"],
  terminal: ["oklch(0.12 0 0)", "oklch(0.16 0.02 155)", "oklch(0.78 0.18 155)", "oklch(0.26 0.06 155)"],
  nord: ["oklch(0.26 0.02 250)", "oklch(0.31 0.02 250)", "oklch(0.72 0.08 220)", "oklch(0.42 0.04 250)"],
  dracula: ["oklch(0.28 0.04 290)", "oklch(0.32 0.04 290)", "oklch(0.72 0.18 290)", "oklch(0.45 0.12 330)"],
  sepia: ["oklch(0.95 0.02 85)", "oklch(0.92 0.025 80)", "oklch(0.45 0.1 70)", "oklch(0.85 0.04 75)"],
  ocean: ["oklch(0.18 0.04 240)", "oklch(0.22 0.05 235)", "oklch(0.7 0.14 195)", "oklch(0.35 0.08 210)"],
  forest: ["oklch(0.2 0.04 140)", "oklch(0.25 0.05 135)", "oklch(0.65 0.15 145)", "oklch(0.38 0.08 70)"],
  sunset: ["oklch(0.22 0.06 25)", "oklch(0.28 0.07 30)", "oklch(0.72 0.18 45)", "oklch(0.5 0.15 350)"],
  rose: ["oklch(0.98 0.01 350)", "oklch(1 0 0)", "oklch(0.55 0.2 350)", "oklch(0.92 0.04 350)"],
  coffee: ["oklch(0.2 0.03 55)", "oklch(0.26 0.04 50)", "oklch(0.55 0.12 65)", "oklch(0.4 0.06 60)"],
  midnight: ["oklch(0.12 0.03 270)", "oklch(0.17 0.04 265)", "oklch(0.68 0.14 250)", "oklch(0.3 0.08 260)"],
  synthwave: ["oklch(0.18 0.08 310)", "oklch(0.24 0.1 315)", "oklch(0.75 0.22 330)", "oklch(0.72 0.18 195)"],
  lavender: ["oklch(0.96 0.03 300)", "oklch(0.98 0.02 300)", "oklch(0.55 0.18 300)", "oklch(0.88 0.06 300)"],
  mint: ["oklch(0.97 0.03 165)", "oklch(1 0 0)", "oklch(0.6 0.14 165)", "oklch(0.88 0.06 165)"],
  candy: ["oklch(0.98 0.02 350)", "oklch(1 0 0)", "oklch(0.7 0.18 350)", "oklch(0.9 0.08 85)"],
  crimson: ["oklch(0.16 0.04 25)", "oklch(0.22 0.05 20)", "oklch(0.58 0.22 25)", "oklch(0.38 0.1 25)"],
  peacock: ["oklch(0.2 0.05 205)", "oklch(0.26 0.06 200)", "oklch(0.62 0.14 65)", "oklch(0.4 0.1 210)"],
  desert: ["oklch(0.92 0.04 75)", "oklch(0.88 0.05 70)", "oklch(0.5 0.14 45)", "oklch(0.75 0.1 55)"],
  berry: ["oklch(0.22 0.05 295)", "oklch(0.28 0.06 298)", "oklch(0.58 0.2 355)", "oklch(0.45 0.12 280)"],
  sage: ["oklch(0.96 0.02 140)", "oklch(0.93 0.025 135)", "oklch(0.48 0.08 145)", "oklch(0.82 0.05 130)"],
  ink: ["oklch(0.96 0.02 270)", "oklch(0.93 0.025 265)", "oklch(0.38 0.12 270)", "oklch(0.82 0.06 268)"],
  honey: ["oklch(0.98 0.04 95)", "oklch(1 0 0)", "oklch(0.65 0.18 85)", "oklch(0.88 0.08 85)"],
}

export function getTheme(): ThemeId {
  try {
    const v = localStorage.getItem(THEME_KEY) as ThemeId | null
    if (v && THEMES.some((t) => t.id === v)) return v
    return DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export function setTheme(theme: ThemeId): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // ignore
  }
}

/** Aplica o tema no documento (classe .theme-* no html). Troca livre, sem conquistas. */
export function applyTheme(theme: ThemeId): void {
  document.documentElement.className = `theme-${theme}`
}
