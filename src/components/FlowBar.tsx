/**
 * Barra que simula fluxo contínuo: um brilho percorre da esquerda para a direita em loop.
 * Animação 100% em CSS (sem requestAnimationFrame) para não travar a navegação.
 */
export function FlowBar() {
  return (
    <div
      data-slot="progress"
      className="h-2 w-full rounded-full overflow-hidden bg-primary/20"
      aria-hidden
    >
      <div
        data-slot="progress-indicator"
        className="h-full w-[200%] animate-[flow-bar_4s_linear_infinite] will-change-transform"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, transparent 20%, var(--primary) 35%, var(--primary) 65%, transparent 80%, transparent 100%)",
          backgroundSize: "50% 100%",
          backgroundRepeat: "repeat-x",
        }}
      />
    </div>
  )
}
