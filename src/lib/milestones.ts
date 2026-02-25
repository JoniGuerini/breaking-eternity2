/** Retorna em qual "marco" de quantidade o gerador está. */
export function getMilestoneIndex(count: number): number {
    if (count < 10) return 0
    return Math.floor(Math.log10(count))
}

/** Retorna qual a quantidade necessária para o próximo marco. */
export function getNextMilestoneThreshold(currentIndex: number): number {
    return Math.pow(10, currentIndex + 1)
}

/** Retorna a quantidade do marco atual (ou 0 se não atingiu o primeiro). */
export function getCurrentMilestoneThreshold(currentIndex: number): number {
    if (currentIndex === 0) return 0
    return Math.pow(10, currentIndex)
}
