import { Link } from "react-router-dom"
import { Gamepad2 } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { playClickSound } from "@/lib/clickSound"

/**
 * Página de login no estilo shadcn block login-03:
 * fundo muted, centralizado, logo + formulário.
 * https://ui.shadcn.com/blocks/login#login-03
 */
export function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium text-foreground hover:opacity-90"
          onClick={() => playClickSound()}
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Gamepad2 className="size-4" />
          </div>
          Breaking Eternity
        </Link>
        <LoginForm />
      </div>
    </div>
  )
}
