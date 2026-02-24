import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { playClickSound } from "@/lib/clickSound"
import { useTranslation } from "react-i18next"
import { getDeviceId } from "@/lib/deviceId"
import { claimSession, getCurrentSessionDevice } from "@/lib/sessionDevice"
import { supabase } from "@/lib/supabase"

export function LoginForm() {
  const { t } = useTranslation()
  const auth = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForceLoginModal, setShowForceLoginModal] = useState(false)

  if (auth?.loading) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-center text-muted-foreground text-sm">{t("auth.loading")}</p>
      </div>
    )
  }

  if (auth?.user && !showForceLoginModal) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.connectedAs")} <span className="font-medium text-foreground">{auth.user.email}</span>
        </p>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => {
              playClickSound()
              auth.signOut()
            }}
          >
            {t("auth.signOut")}
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/" onClick={() => playClickSound()}>
              {t("auth.goToGame")}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (auth?.user && showForceLoginModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" aria-modal="true" role="dialog" aria-labelledby="force-login-title">
        <Card className="max-w-md w-full p-6 space-y-4 shadow-lg">
          <h2 id="force-login-title" className="font-semibold text-lg">
            {t("auth.forceLoginTitle")}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("auth.forceLoginDesc")}
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={async () => {
                playClickSound()
                await auth!.signOut()
                setShowForceLoginModal(false)
              }}
            >
              {t("auth.cancel")}
            </Button>
            <Button
              onClick={async () => {
                playClickSound()
                const deviceId = getDeviceId()
                await claimSession(auth!.user!.id, deviceId)
                setShowForceLoginModal(false)
              }}
            >
              {t("auth.forceLogin")}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!auth || loading || !email.trim() || !password) return
    playClickSound()
    setError(null)
    setLoading(true)
    const { error: err } =
      mode === "login"
        ? await auth.signIn(email.trim(), password)
        : await auth.signUp(email.trim(), password)
    if (err) {
      setLoading(false)
      setError(err.message)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const deviceId = getDeviceId()
    const currentDevice = await getCurrentSessionDevice(user.id)
    if (currentDevice != null && currentDevice !== deviceId) {
      setShowForceLoginModal(true)
      setLoading(false)
      return
    }
    await claimSession(user.id, deviceId)
    setLoading(false)
    if (mode === "signup") {
      setEmail("")
      setPassword("")
      setMode("login")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="login-email">{t("auth.email")}</Label>
          <Input
            id="login-email"
            type="email"
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            autoComplete="email"
            disabled={loading}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="login-password">{t("auth.password")}</Label>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(null)
            }}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            disabled={loading}
            required
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t("auth.wait") : mode === "login" ? t("auth.login") : t("auth.signUp")}
        </Button>
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground underline"
          onClick={() => {
            playClickSound()
            setMode((m) => (m === "login" ? "signup" : "login"))
            setError(null)
          }}
        >
          {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}
        </button>
      </div>
    </form>
  )
}
