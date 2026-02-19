import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContext"
import { playClickSound } from "@/lib/clickSound"

export function LoginForm() {
  const auth = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (auth?.loading) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-center text-muted-foreground text-sm">Carregando…</p>
      </div>
    )
  }

  if (auth?.user) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-center text-sm text-muted-foreground">
          Conectado como <span className="font-medium text-foreground">{auth.user.email}</span>
        </p>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => {
              playClickSound()
              auth.signOut()
            }}
          >
            Sair
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/" onClick={() => playClickSound()}>
              Ir para o jogo
            </Link>
          </Button>
        </div>
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
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
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
          <Label htmlFor="login-email">E-mail</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="nome@exemplo.com"
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
          <Label htmlFor="login-password">Senha</Label>
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
          {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
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
          {mode === "login" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
        </button>
      </div>
    </form>
  )
}
