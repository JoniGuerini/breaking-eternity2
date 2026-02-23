/**
 * Formata um intervalo em segundos para uma string legível, 
 * suportando de segundos até milênios.
 */
export function formatTime(seconds: number): string {
    if (seconds === 0) return "0s"
    if (seconds < 0) return "0s"

    // Para tempos muito curtos, mostra decimais
    if (seconds < 60) {
        return `${Number(seconds.toFixed(2))}s`
    }

    const units = [
        { label: "mil", value: 31536000 * 1000 }, // milênio
        { label: "dec", value: 31536000 * 10 },   // década
        { label: "ano", value: 31536000 },        // ano
        { label: "mes", value: 86400 * 30 },      // mês (30 dias)
        { label: "sem", value: 86400 * 7 },       // semana
        { label: "d", value: 86400 },             // dia
        { label: "h", value: 3600 },              // hora
        { label: "m", value: 60 },                // minuto
        { label: "s", value: 1 },                 // segundo
    ]

    let remaining = Math.floor(seconds)
    const result: string[] = []

    for (const unit of units) {
        if (remaining >= unit.value) {
            const count = Math.floor(remaining / unit.value)
            result.push(`${count}${unit.label}`)
            remaining %= unit.value
            // Limitamos a exibição das duas maiores unidades para não ficar muito longo
            if (result.length >= 2) break
        }
    }

    return result.join(" ")
}
