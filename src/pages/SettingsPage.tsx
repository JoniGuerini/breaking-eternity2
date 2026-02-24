import { useContext, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { GameContext } from "@/context/GameContext"
import {
  getClickSoundEnabled,
  getClickSoundVolume,
  playClickSound,
  setClickSoundEnabled as persistClickSound,
  setClickSoundVolume as persistClickSoundVolume,
} from "@/lib/clickSound"
import {
  getShortcut,
  getShortcutDisplayKey,
  keyEventToShortcutKey,
  mouseButtonToShortcutKey,
  resetShortcutsToDefaults,
  setShortcut,
  SHORTCUT_LABELS,
  type ShortcutId,
} from "@/lib/shortcuts"
import { applyTheme, getTheme, setTheme, THEMES, THEME_PREVIEW_COLORS, type ThemeId } from "@/lib/theme"
import { useAuth } from "@/context/AuthContext"
import { setLanguage, SUPPORTED_LANGUAGES, type SupportedLocale } from "@/i18n"

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const ctx = useContext(GameContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [openReset, setOpenReset] = useState(false)
  const [clickSoundEnabled, setClickSoundEnabled] = useState(getClickSoundEnabled)
  const [clickSoundVolume, setClickSoundVolume] = useState(() => getClickSoundVolume())
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => getTheme())
  const [tab, setTab] = useState<"geral" | "temas" | "atalhos" | "conta" | "avancado">("geral")
  const [recordingId, setRecordingId] = useState<ShortcutId | null>(null)
  const [, forceUpdate] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement)

  // Reseta para a aba Geral quando o atalho de configurações é acionado
  useEffect(() => {
    const state = location.state as { tab?: string } | null
    if (state?.tab === "geral") {
      setTab("geral")
        // Remove o foco do botão de aba anterior para limpar o highlight
        ; (document.activeElement as HTMLElement | null)?.blur()
      // Limpa o state para não repetir ao navegar internamente
      navigate("/configuracoes", { replace: true, state: null })
    }
  }, [location.state])

  useEffect(() => {
    if (recordingId === null) return
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const key = keyEventToShortcutKey(e)
      setShortcut(recordingId, key)
      setRecordingId(null)
      playClickSound()
      forceUpdate((n) => n + 1)
    }
    const onAuxClick = (e: MouseEvent) => {
      if (e.button < 4) return
      e.preventDefault()
      e.stopPropagation()
      const key = mouseButtonToShortcutKey(e.button)
      if (key) {
        setShortcut(recordingId, key)
        setRecordingId(null)
        playClickSound()
        forceUpdate((n) => n + 1)
      }
    }
    window.addEventListener("keydown", onKeyDown, { capture: true })
    window.addEventListener("auxclick", onAuxClick, { capture: true })
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true })
      window.removeEventListener("auxclick", onAuxClick, { capture: true })
    }
  }, [recordingId])

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange)
  }, [])

  const auth = useAuth()

  function goToLogin() {
    playClickSound()
    navigate("/entrar")
  }

  async function toggleFullscreen() {
    playClickSound()
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      // usuário cancelou ou navegador não suporta
    }
  }

  if (!ctx) return null
  const {
    resetProgress,
    autoUnlockNextGerador,
    setAutoUnlockNextGerador,
    showFpsCounter,
    setShowFpsCounter,
    persistSave,
    cloudSaveInterval,
    setCloudSaveInterval,
  } = ctx

  function handleThemeChange(theme: ThemeId) {
    playClickSound()
    setTheme(theme)
    applyTheme(theme)
    setCurrentTheme(theme)
  }

  function toggleClickSound() {
    const next = !clickSoundEnabled
    persistClickSound(next)
    setClickSoundEnabled(next)
    if (next) playClickSound()
  }

  function handleVolumeChange(value: number) {
    const v = Math.round(value)
    setClickSoundVolume(v)
    persistClickSoundVolume(v)
  }

  function handleConfirmReset() {
    resetProgress()
    setOpenReset(false)
    navigate("/")
  }

  async function handleExit() {
    playClickSound()
    // Salva o jogo antes de sair
    persistSave()
    // Aguarda um pouco para garantir que o save foi persistido
    await new Promise((resolve) => setTimeout(resolve, 100))
    // Tenta fechar o app (funciona no Tauri)
    try {
      if (typeof window !== "undefined" && (window as any).__TAURI__) {
        const { getCurrentWindow } = await import("@tauri-apps/api/window")
        await getCurrentWindow().close()
      } else {
        // No navegador, apenas fecha a aba se possível
        window.close()
      }
    } catch {
      // Ignora erros ao fechar
    }
  }

  return (
    <section className="w-full space-y-6">
      <div className="flex flex-nowrap border-b border-border gap-0" role="tablist" aria-label="Configurações">
        <button
          type="button"
          onClick={() => {
            playClickSound()
            setTab("geral")
          }}
          className={`flex-1 min-w-0 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${tab === "geral"
            ? "text-foreground border-b-2 border-primary"
            : "text-muted-foreground hover:text-foreground"
            }`}
          aria-selected={tab === "geral"}
          role="tab"
        >
          {t("settings.tabs.geral")}
        </button>
        <button
          type="button"
          onClick={() => {
            playClickSound()
            setTab("temas")
          }}
          className={`flex-1 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${tab === "temas"
            ? "text-foreground border-b-2 border-primary"
            : "text-muted-foreground hover:text-foreground"
            }`}
          aria-selected={tab === "temas"}
          role="tab"
        >
          {t("settings.tabs.temas")}
        </button>
        <button
          type="button"
          onClick={() => {
            playClickSound()
            setTab("atalhos")
          }}
          className={`flex-1 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${tab === "atalhos"
            ? "text-foreground border-b-2 border-primary"
            : "text-muted-foreground hover:text-foreground"
            }`}
          aria-selected={tab === "atalhos"}
          role="tab"
        >
          {t("settings.tabs.atalhos")}
        </button>
        <button
          type="button"
          onClick={() => {
            playClickSound()
            setTab("conta")
          }}
          className={`flex-1 min-w-0 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${tab === "conta"
            ? "text-foreground border-b-2 border-primary"
            : "text-muted-foreground hover:text-foreground"
            }`}
          aria-selected={tab === "conta"}
          role="tab"
        >
          {t("settings.tabs.conta")}
        </button>
        <button
          type="button"
          onClick={() => {
            playClickSound()
            setTab("avancado")
          }}
          className={`flex-1 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${tab === "avancado"
            ? "text-foreground border-b-2 border-primary"
            : "text-muted-foreground hover:text-foreground"
            }`}
          aria-selected={tab === "avancado"}
          role="tab"
        >
          {t("settings.tabs.avancado")}
        </button>
      </div>

      {tab === "geral" && (
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-x-0 gap-y-6 md:gap-x-6 md:gap-y-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{t("settings.language")}</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t("settings.languageDesc")}
                  </p>
                </div>
                <Select
                  value={i18n.language}
                  onValueChange={(v) => {
                    playClickSound()
                    if (SUPPORTED_LANGUAGES.some((l) => l.code === v)) setLanguage(v as SupportedLocale)
                  }}
                >
                  <SelectTrigger
                    className="w-[180px]"
                    aria-label={t("settings.language")}
                  >
                    <SelectValue placeholder={t("settings.language")} />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map(({ code, label }) => (
                      <SelectItem key={code} value={code}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{t("settings.clickSound")}</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t("settings.clickSoundDesc")}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={clickSoundEnabled}
                  onClick={toggleClickSound}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${clickSoundEnabled ? "bg-primary" : "bg-muted"}`}
                >
                  <span
                    className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1"
                  />
                </button>
              </div>
              {clickSoundEnabled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">{t("settings.clickVolume")}</span>
                    <span className="text-sm font-mono tabular-nums">{clickSoundVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={clickSoundVolume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    onMouseUp={() => clickSoundEnabled && playClickSound()}
                    onTouchEnd={() => clickSoundEnabled && playClickSound()}
                    className="w-full h-2 rounded-full appearance-none bg-muted accent-primary cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-0 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                    aria-label={t("settings.clickVolumeLabel")}
                  />
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{t("settings.fpsCounter")}</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t("settings.fpsCounterDesc")}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showFpsCounter}
                  onClick={() => {
                    playClickSound()
                    setShowFpsCounter((v) => !v)
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${showFpsCounter ? "bg-primary" : "bg-muted"}`}
                >
                  <span
                    className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1"
                  />
                </button>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{t("settings.fullscreen")}</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t("settings.fullscreenDesc")}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isFullscreen}
                  onClick={toggleFullscreen}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${isFullscreen ? "bg-primary" : "bg-muted"}`}
                >
                  <span
                    className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1"
                  />
                </button>
              </div>
            </div>
            <div className="hidden md:flex self-stretch items-stretch">
              <Separator orientation="vertical" className="h-full min-h-[200px]" />
            </div>
            <div className="space-y-6">
              <div>
                <p className="font-medium">{t("settings.saveProgress")}</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {t("settings.saveProgressDescBefore")} <span className="font-mono font-semibold text-foreground">{cloudSaveInterval / 1000}</span> {t("settings.saveProgressDescAfter")}
                </p>
                <div className="flex flex-col gap-2 mt-4">
                  <div className="space-y-4 pt-2 pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{t("settings.cloudSaveInterval")}</span>
                      <span className="text-sm font-mono tabular-nums">{cloudSaveInterval / 1000}s</span>
                    </div>
                    <input
                      type="range"
                      min={5000}
                      max={60000}
                      step={5000}
                      value={cloudSaveInterval}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setCloudSaveInterval(val)
                      }}
                      onMouseUp={() => playClickSound()}
                      onTouchEnd={() => playClickSound()}
                      className="w-full h-2 rounded-full appearance-none bg-muted accent-primary cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-0 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                      aria-label={t("settings.cloudSaveInterval")}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("settings.cloudSaveHint")}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {t("settings.lastSave")}: <span className="font-mono text-foreground">{ctx.lastSaveTime ? new Date(ctx.lastSaveTime).toLocaleString() : t("settings.never")}</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      playClickSound()
                      persistSave()
                    }}
                  >
                    {t("settings.saveNow")}
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <div>
                  <p className="font-medium">{t("settings.downloadDesktop")}</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t("settings.downloadDesktopDesc")}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      playClickSound()
                      window.open(
                        "https://github.com/JoniGuerini/breaking-eternity2/releases/download/desktop-app/Breaking.Eternity_0.1.0_x64-setup.exe",
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }}
                  >
                    {t("settings.windowsExe")}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      playClickSound()
                      window.open(
                        "https://github.com/JoniGuerini/breaking-eternity2/releases/download/desktop-app/Breaking.Eternity_0.1.0_aarch64.dmg",
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }}
                  >
                    {t("settings.macDmg")}
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <div>
                  <p className="font-medium">{t("settings.restoreDefaults")}</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t("settings.restoreDefaultsDesc")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => {
                    playClickSound()
                    persistClickSound(true)
                    setClickSoundEnabled(true)
                    persistClickSoundVolume(100)
                    setClickSoundVolume(100)
                    setShowFpsCounter(false)
                    setAutoUnlockNextGerador(false)
                    setTheme("dark")
                    applyTheme("dark")
                    setCurrentTheme("dark")
                    resetShortcutsToDefaults()
                    setCloudSaveInterval(10000)
                    forceUpdate((n) => n + 1)
                  }}
                >
                  {t("settings.restoreDefaults")}
                </Button>
              </div>

              <Separator />

              <div>
                <div>
                  <p className="font-medium">{t("settings.exitGame")}</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t("settings.exitGameDesc")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleExit}
                >
                  {t("settings.exit")}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {tab === "temas" && (
        <Card className="p-6 space-y-4">
          <div>
            <p className="font-medium">{t("settings.themeTitle")}</p>
            <p className="text-muted-foreground text-sm mt-1">
              {t("settings.themeDesc")}
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {THEMES.map(({ id }) => {
              const colors = THEME_PREVIEW_COLORS[id]
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleThemeChange(id)}
                  className={`flex flex-col gap-2 rounded-lg border-2 px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${currentTheme === id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-accent hover:border-accent text-foreground"
                    }`}
                >
                  <span className="text-sm font-medium leading-tight">{t(`settings.themes.${id}`)}</span>
                  <div className="flex gap-1 flex-wrap" aria-hidden>
                    {colors.map((color, i) => (
                      <span
                        key={i}
                        className="size-4 shrink-0 rounded-sm border border-black/10 shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      {tab === "avancado" && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">{t("settings.advancedUnlock")}</p>
              <p className="text-muted-foreground text-sm mt-1">
                {t("settings.advancedUnlockDesc")}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoUnlockNextGerador}
              onClick={() => {
                playClickSound()
                setAutoUnlockNextGerador((v) => !v)
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${autoUnlockNextGerador ? "bg-primary" : "bg-muted"}`}
            >
              <span
                className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-1"
              />
            </button>
          </div>
          <div>
            <p className="font-medium">{t("settings.resetProgress")}</p>
            <p className="text-muted-foreground text-sm mt-1">
              {t("settings.resetProgressDesc")}
            </p>
          </div>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              playClickSound()
              setOpenReset(true)
            }}
          >
            {t("settings.resetProgress")}
          </Button>
        </Card>
      )}

      {tab === "atalhos" && (
        <Card className="p-6 space-y-5">
          <div>
            <p className="font-medium">{t("settings.shortcutsTitle")}</p>
            <p className="text-muted-foreground text-sm mt-1">
              {t("settings.shortcutsDesc")}
            </p>
          </div>
          <div className="space-y-4">
            {(Object.keys(SHORTCUT_LABELS) as ShortcutId[]).map((id) => (
              <div key={id} className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm font-medium">{t(`shortcuts.${id}`)}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="font-mono min-w-[10rem]"
                  onClick={() => {
                    playClickSound()
                    setRecordingId(id)
                  }}
                >
                  {recordingId === id
                    ? t("settings.pressKey")
                    : getShortcutDisplayKey(getShortcut(id))}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "conta" && (
        <Card className="p-6 space-y-5">
          <div>
            <p className="font-medium">{t("settings.accountTitle")}</p>
            <p className="text-muted-foreground text-sm mt-1">
              {t("settings.accountDesc")}
            </p>
          </div>
          {auth?.loading ? (
            <p className="text-muted-foreground text-sm">{t("auth.loading")}</p>
          ) : auth?.user ? (
            <div className="space-y-4">
              <p className="text-sm">
                {t("settings.connectedAs")} <span className="font-medium text-foreground">{auth.user.email}</span>
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  playClickSound()
                  auth.signOut()
                }}
              >
                {t("auth.signOut")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("settings.useLoginPage")}
              </p>
              <Button onClick={goToLogin}>
                {t("settings.goToLogin")}
              </Button>
            </div>
          )}
        </Card>
      )}

      {openReset && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
          onClick={() => {
            playClickSound()
            setOpenReset(false)
          }}
        >
          <Card
            className="w-full max-w-sm p-6 space-y-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="reset-dialog-title" className="text-lg font-semibold">
              {t("settings.resetDialogTitle")}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("settings.resetDialogDesc")}
            </p>
            <div className="flex w-full flex-row justify-between gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  playClickSound()
                  setOpenReset(false)
                }}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  playClickSound()
                  handleConfirmReset()
                }}
              >
                {t("common.confirm")}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </section>
  )
}
