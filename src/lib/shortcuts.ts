const SHORTCUTS_KEY = "breaking-eternity-shortcuts"

export type ShortcutId =
  | "nextMenu"
  | "prevMenu"
  | "menuGeradores"
  | "menuMelhorias"
  | "menuConquistas"
  | "menuConfiguracoes"
  | "scrollTop"
  | "scrollBottom"

export const SHORTCUT_DEFAULTS: Record<ShortcutId, string> = {
  nextMenu: "ArrowRight",
  prevMenu: "ArrowLeft",
  menuGeradores: "Digit1",
  menuMelhorias: "Digit2",
  menuConquistas: "Digit4",
  menuConfiguracoes: "Digit3",
  scrollTop: "Home",
  scrollBottom: "End",
}

export const SHORTCUT_LABELS: Record<ShortcutId, string> = {
  nextMenu: "Próximo menu",
  prevMenu: "Menu anterior",
  menuGeradores: "Ir para Geradores",
  menuMelhorias: "Ir para Melhorias",
  menuConquistas: "Ir para Conquistas",
  menuConfiguracoes: "Ir para Configurações",
  scrollTop: "Rolar para cima",
  scrollBottom: "Rolar para baixo",
}

export type ShortcutsMap = Partial<Record<ShortcutId, string>>

function loadShortcuts(): ShortcutsMap {
  try {
    const raw = localStorage.getItem(SHORTCUTS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    const out: ShortcutsMap = {}
    for (const id of Object.keys(SHORTCUT_DEFAULTS) as ShortcutId[]) {
      if (typeof parsed[id] === "string") out[id] = parsed[id]
    }
    return out
  } catch {
    return {}
  }
}

let cache: ShortcutsMap | null = null

export function getShortcut(id: ShortcutId): string {
  if (!cache) cache = loadShortcuts()
  return cache[id] ?? SHORTCUT_DEFAULTS[id]
}

export function setShortcut(id: ShortcutId, key: string): void {
  if (!cache) cache = loadShortcuts()
  cache = { ...cache, [id]: key }
  localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(cache))
}

/** Restaura todos os atalhos para os valores padrão. */
export function resetShortcutsToDefaults(): void {
  cache = null
  try {
    localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(SHORTCUT_DEFAULTS))
  } catch {
    // ignore
  }
}

/** Nome amigável da tecla para exibir (ex: "ArrowRight" → "Seta direita") */
const KEY_DISPLAY: Record<string, string> = {
  ArrowRight: "Seta direita",
  ArrowLeft: "Seta esquerda",
  ArrowUp: "Seta cima",
  ArrowDown: "Seta baixo",
  Home: "Home",
  End: "End",
  PageUp: "Page Up",
  PageDown: "Page Down",
  Space: "Espaço",
  Enter: "Enter",
  Tab: "Tab",
  Escape: "Esc",
  Backspace: "Backspace",
  Insert: "Insert",
  Delete: "Delete",
}

export function getShortcutDisplayKey(key: string): string {
  if (KEY_DISPLAY[key]) return KEY_DISPLAY[key]
  if (key.startsWith("Key")) return key.slice(3).toUpperCase()
  if (key.startsWith("Digit")) return key.slice(5)
  if (key.startsWith("Numpad")) return "Num " + key.slice(6)
  if (key.startsWith("Mouse")) return "Botão " + key.slice(5)
  return key
}

/** Converte um evento keydown em uma string armazenável (code para teclado) */
export function keyEventToShortcutKey(e: KeyboardEvent): string {
  return e.code
}

/** Converte um evento de clique do mouse (botão lateral) em string armazenável */
export function mouseButtonToShortcutKey(button: number): string | null {
  if (button >= 4) return `Mouse${button}`
  return null
}
