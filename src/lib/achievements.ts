import type Decimal from "break_eternity.js"

/** Estado necessário para avaliar as condições das conquistas */
export interface AchievementCheckState {
  total: Decimal
  geradores: number[]
  upgrades: number[]
  speedUpgrades: number[]
  totalProducedLifetime: Decimal
  totalPlayTimeSeconds: number
  geradoresCompradosManual: number
  jaColetouManual: boolean
}

export interface Achievement {
  id: string
  name: string
  description: string
  points: number
  /** Retorna true se a conquista foi desbloqueada com o estado atual */
  check: (state: AchievementCheckState) => boolean
}

function sum(arr: number[] | undefined): number {
  return (arr?.reduce((a, b) => a + b, 0) ?? 0)
}

function totalGeradores(s: AchievementCheckState): number {
  return s.geradores.reduce((a, b) => a + b, 0)
}

/** Lista de conquistas no estilo WoW: pontos cosméticos por desbloquear */
export const ACHIEVEMENTS: Achievement[] = [
  // —— Primeiros passos ——
  {
    id: "primeiro-gerador",
    name: "Primeiro gerador",
    description: "Desbloqueie o Gerador 1",
    points: 10,
    check: (s) => s.geradores[0] >= 1,
  },
  {
    id: "primeira-melhoria",
    name: "Primeira melhoria",
    description: "Compre uma melhoria de produção",
    points: 10,
    check: (s) => sum(s.upgrades) >= 1,
  },
  {
    id: "primeira-velocidade",
    name: "Mais rápido",
    description: "Compre uma melhoria de velocidade",
    points: 10,
    check: (s) => sum(s.speedUpgrades) >= 1,
  },

  // —— Recurso acumulado (milestones) ——
  { id: "rec-100", name: "Cem recursos", description: "Acumule 100 de recurso", points: 5, check: (s) => s.total.gte(100) },
  { id: "rec-1e3", name: "Mil recurso", description: "Acumule 1.000 de recurso", points: 8, check: (s) => s.total.gte(1e3) },
  { id: "rec-1e4", name: "Dez mil", description: "Acumule 10.000 de recurso", points: 10, check: (s) => s.total.gte(1e4) },
  { id: "rec-1e5", name: "Cem mil", description: "Acumule 100.000 de recurso", points: 12, check: (s) => s.total.gte(1e5) },
  { id: "rec-1e6", name: "Milhão", description: "Acumule 1 milhão de recurso", points: 15, check: (s) => s.total.gte(1e6) },
  { id: "rec-1e7", name: "Dez milhões", description: "Acumule 10 milhões de recurso", points: 18, check: (s) => s.total.gte(1e7) },
  { id: "rec-1e8", name: "Cem milhões", description: "Acumule 100 milhões de recurso", points: 20, check: (s) => s.total.gte(1e8) },
  { id: "rec-1e9", name: "Bilhões", description: "Acumule 1 bilhão de recurso", points: 25, check: (s) => s.total.gte(1e9) },
  { id: "rec-1e10", name: "Dez bilhões", description: "Acumule 10 bilhões de recurso", points: 28, check: (s) => s.total.gte(1e10) },
  { id: "rec-1e11", name: "Cem bilhões", description: "Acumule 100 bilhões de recurso", points: 30, check: (s) => s.total.gte(1e11) },
  { id: "rec-1e12", name: "Trilhão", description: "Acumule 1 trilhão de recurso", points: 35, check: (s) => s.total.gte(1e12) },
  { id: "rec-1e15", name: "Quatrilhão", description: "Acumule 1 quatrilhão de recurso", points: 40, check: (s) => s.total.gte(1e15) },
  { id: "rec-1e18", name: "Quintilhão", description: "Acumule 1 quintilhão de recurso", points: 45, check: (s) => s.total.gte(1e18) },
  { id: "rec-1e21", name: "Sextilhão", description: "Acumule 1 sextilhão de recurso", points: 50, check: (s) => s.total.gte(1e21) },
  { id: "rec-1e24", name: "Septilhão", description: "Acumule 1 septilhão de recurso", points: 55, check: (s) => s.total.gte(1e24) },
  { id: "rec-1e27", name: "Octilhão", description: "Acumule 1 octilhão de recurso", points: 60, check: (s) => s.total.gte(1e27) },
  { id: "rec-1e30", name: "Nonilhão", description: "Acumule 1 nonilhão de recurso", points: 65, check: (s) => s.total.gte(1e30) },
  { id: "rec-1e33", name: "Decilhão", description: "Acumule 1 decilhão de recurso", points: 70, check: (s) => s.total.gte(1e33) },
  { id: "rec-1e36", name: "Undecilhão", description: "Acumule 1 undecilhão de recurso", points: 75, check: (s) => s.total.gte(1e36) },
  { id: "rec-1e39", name: "Dodecilhão", description: "Acumule 1 dodecilhão de recurso", points: 80, check: (s) => s.total.gte(1e39) },
  { id: "rec-1e42", name: "Tredecilhão", description: "Acumule 1 tredecilhão de recurso", points: 85, check: (s) => s.total.gte(1e42) },
  { id: "rec-1e45", name: "Quatrodecilhão", description: "Acumule 1 quatrodecilhão de recurso", points: 90, check: (s) => s.total.gte(1e45) },
  { id: "rec-1e48", name: "Quindecilhão", description: "Acumule 1 quindecilhão de recurso", points: 95, check: (s) => s.total.gte(1e48) },
  { id: "rec-1e51", name: "Sedecilhão", description: "Acumule 1 sedecilhão de recurso", points: 100, check: (s) => s.total.gte(1e51) },
  { id: "rec-1e54", name: "Septendecilhão", description: "Acumule 1 septendecilhão de recurso", points: 105, check: (s) => s.total.gte(1e54) },
  { id: "rec-1e57", name: "Octodecilhão", description: "Acumule 1 octodecilhão de recurso", points: 110, check: (s) => s.total.gte(1e57) },
  { id: "rec-1e60", name: "Novemdecilhão", description: "Acumule 1 novemdecilhão de recurso", points: 115, check: (s) => s.total.gte(1e60) },
  { id: "rec-1e63", name: "Vigecilhão", description: "Acumule 1 vigecilhão de recurso", points: 120, check: (s) => s.total.gte(1e63) },
  { id: "rec-1e66", name: "Unvigecilhão", description: "Acumule 1 unvigecilhão de recurso", points: 125, check: (s) => s.total.gte(1e66) },
  { id: "rec-1e69", name: "Dovigecilhão", description: "Acumule 1 dovigecilhão de recurso", points: 130, check: (s) => s.total.gte(1e69) },
  { id: "rec-1e72", name: "Trevigecilhão", description: "Acumule 1 trevigecilhão de recurso", points: 135, check: (s) => s.total.gte(1e72) },
  { id: "rec-1e75", name: "Quatrovigecilhão", description: "Acumule 1 quatrovigecilhão de recurso", points: 140, check: (s) => s.total.gte(1e75) },
  { id: "rec-1e78", name: "Quinvigecilhão", description: "Acumule 1 quinvigecilhão de recurso", points: 145, check: (s) => s.total.gte(1e78) },
  { id: "rec-1e81", name: "Sexvigecilhão", description: "Acumule 1 sexvigecilhão de recurso", points: 150, check: (s) => s.total.gte(1e81) },
  { id: "rec-1e84", name: "Septenvigecilhão", description: "Acumule 1 septenvigecilhão de recurso", points: 155, check: (s) => s.total.gte(1e84) },
  { id: "rec-1e87", name: "Octovigecilhão", description: "Acumule 1 octovigecilhão de recurso", points: 160, check: (s) => s.total.gte(1e87) },
  { id: "rec-1e90", name: "Novemvigecilhão", description: "Acumule 1 novemvigecilhão de recurso", points: 165, check: (s) => s.total.gte(1e90) },
  { id: "rec-1e93", name: "Trigecilhão", description: "Acumule 1 trigecilhão de recurso", points: 170, check: (s) => s.total.gte(1e93) },
  { id: "rec-1e96", name: "Untrigecilhão", description: "Acumule 1 untrigecilhão de recurso", points: 175, check: (s) => s.total.gte(1e96) },
  { id: "rec-1e99", name: "Dotrigecilhão", description: "Acumule 1 dotrigecilhão de recurso", points: 180, check: (s) => s.total.gte(1e99) },
  { id: "rec-1e100", name: "Centecilhão", description: "Acumule 1e100 de recurso", points: 200, check: (s) => s.total.gte(1e100) },

  // —— Unidades totais de geradores ——
  { id: "unid-10", name: "Dez unidades", description: "Tenha 10 unidades totais de geradores", points: 10, check: (s) => totalGeradores(s) >= 10 },
  { id: "unid-50", name: "Cinquenta unidades", description: "Tenha 50 unidades totais de geradores", points: 15, check: (s) => totalGeradores(s) >= 50 },
  { id: "unid-100", name: "Cem unidades", description: "Tenha 100 unidades totais de geradores", points: 20, check: (s) => totalGeradores(s) >= 100 },
  { id: "unid-250", name: "Duzentas e cinquenta", description: "Tenha 250 unidades totais de geradores", points: 25, check: (s) => totalGeradores(s) >= 250 },
  { id: "unid-500", name: "Quinhentas unidades", description: "Tenha 500 unidades totais de geradores", points: 30, check: (s) => totalGeradores(s) >= 500 },
  { id: "unid-1k", name: "Mil unidades", description: "Tenha 1.000 unidades totais de geradores", points: 35, check: (s) => totalGeradores(s) >= 1000 },
  { id: "unid-2500", name: "2.500 unidades", description: "Tenha 2.500 unidades totais de geradores", points: 40, check: (s) => totalGeradores(s) >= 2500 },
  { id: "unid-5k", name: "Cinco mil unidades", description: "Tenha 5.000 unidades totais de geradores", points: 45, check: (s) => totalGeradores(s) >= 5000 },
  { id: "unid-10k", name: "Dez mil unidades", description: "Tenha 10.000 unidades totais de geradores", points: 50, check: (s) => totalGeradores(s) >= 10000 },
  { id: "unid-25k", name: "Vinte e cinco mil", description: "Tenha 25.000 unidades totais de geradores", points: 60, check: (s) => totalGeradores(s) >= 25000 },
  { id: "unid-50k", name: "Cinquenta mil", description: "Tenha 50.000 unidades totais de geradores", points: 70, check: (s) => totalGeradores(s) >= 50000 },
  { id: "unid-100k", name: "Cem mil unidades", description: "Tenha 100.000 unidades totais de geradores", points: 85, check: (s) => totalGeradores(s) >= 100000 },

  // —— Gerador específico desbloqueado (de 10 em 10: 1, 10, 20, … 100) ——
  { id: "g10", name: "Gerador 10", description: "Desbloqueie o Gerador 10", points: 15, check: (s) => s.geradores[9] >= 1 },
  { id: "g20", name: "Gerador 20", description: "Desbloqueie o Gerador 20", points: 25, check: (s) => s.geradores[19] >= 1 },
  { id: "g30", name: "Gerador 30", description: "Desbloqueie o Gerador 30", points: 35, check: (s) => s.geradores[29] >= 1 },
  { id: "g40", name: "Gerador 40", description: "Desbloqueie o Gerador 40", points: 45, check: (s) => s.geradores[39] >= 1 },
  { id: "g50", name: "Gerador 50", description: "Desbloqueie o Gerador 50", points: 55, check: (s) => s.geradores[49] >= 1 },
  { id: "g60", name: "Gerador 60", description: "Desbloqueie o Gerador 60", points: 65, check: (s) => s.geradores[59] >= 1 },
  { id: "g70", name: "Gerador 70", description: "Desbloqueie o Gerador 70", points: 75, check: (s) => s.geradores[69] >= 1 },
  { id: "g80", name: "Gerador 80", description: "Desbloqueie o Gerador 80", points: 85, check: (s) => s.geradores[79] >= 1 },
  { id: "g90", name: "Gerador 90", description: "Desbloqueie o Gerador 90", points: 95, check: (s) => s.geradores[89] >= 1 },
  { id: "g100", name: "Último gerador", description: "Desbloqueie o Gerador 100", points: 150, check: (s) => s.geradores[99] >= 1 },

  // —— Produção total (lifetime) ——
  { id: "prod-1e6", name: "Produção: 1M", description: "Produza 1 milhão no total (lifetime)", points: 15, check: (s) => s.totalProducedLifetime.gte(1e6) },
  { id: "prod-1e9", name: "Produção: 1B", description: "Produza 1 bilhão no total (lifetime)", points: 25, check: (s) => s.totalProducedLifetime.gte(1e9) },
  { id: "prod-1e12", name: "Produção: 1T", description: "Produza 1 trilhão no total (lifetime)", points: 35, check: (s) => s.totalProducedLifetime.gte(1e12) },
  { id: "prod-1e15", name: "Produção: 1Q", description: "Produza 1 quatrilhão no total (lifetime)", points: 45, check: (s) => s.totalProducedLifetime.gte(1e15) },
  { id: "prod-1e18", name: "Produção: 1 Qi", description: "Produza 1 quintilhão no total (lifetime)", points: 55, check: (s) => s.totalProducedLifetime.gte(1e18) },
  { id: "prod-1e21", name: "Produção: 1 Sx", description: "Produza 1 sextilhão no total (lifetime)", points: 65, check: (s) => s.totalProducedLifetime.gte(1e21) },
  { id: "prod-1e24", name: "Produção: 1 Sp", description: "Produza 1 septilhão no total (lifetime)", points: 75, check: (s) => s.totalProducedLifetime.gte(1e24) },
  { id: "prod-1e27", name: "Produção: 1 Oc", description: "Produza 1 octilhão no total (lifetime)", points: 85, check: (s) => s.totalProducedLifetime.gte(1e27) },
  { id: "prod-1e30", name: "Produção: 1 No", description: "Produza 1 nonilhão no total (lifetime)", points: 95, check: (s) => s.totalProducedLifetime.gte(1e30) },
  { id: "prod-1e33", name: "Produção: 1 Dc", description: "Produza 1 decilhão no total (lifetime)", points: 105, check: (s) => s.totalProducedLifetime.gte(1e33) },
  { id: "prod-1e36", name: "Produção: 1 Ud", description: "Produza 1 undecilhão no total (lifetime)", points: 115, check: (s) => s.totalProducedLifetime.gte(1e36) },
  { id: "prod-1e39", name: "Produção: 1 Dd", description: "Produza 1 dodecilhão no total (lifetime)", points: 125, check: (s) => s.totalProducedLifetime.gte(1e39) },
  { id: "prod-1e42", name: "Produção: 1 Td", description: "Produza 1 tredecilhão no total (lifetime)", points: 135, check: (s) => s.totalProducedLifetime.gte(1e42) },
  { id: "prod-1e45", name: "Produção: 1 Qd", description: "Produza 1 quatrodecilhão no total (lifetime)", points: 145, check: (s) => s.totalProducedLifetime.gte(1e45) },
  { id: "prod-1e48", name: "Produção: 1 Qid", description: "Produza 1 quindecilhão no total (lifetime)", points: 155, check: (s) => s.totalProducedLifetime.gte(1e48) },
  { id: "prod-1e51", name: "Produção: 1 Sd", description: "Produza 1 sedecilhão no total (lifetime)", points: 165, check: (s) => s.totalProducedLifetime.gte(1e51) },
  { id: "prod-1e54", name: "Produção: 1 Spd", description: "Produza 1 septendecilhão no total (lifetime)", points: 175, check: (s) => s.totalProducedLifetime.gte(1e54) },
  { id: "prod-1e57", name: "Produção: 1 Od", description: "Produza 1 octodecilhão no total (lifetime)", points: 185, check: (s) => s.totalProducedLifetime.gte(1e57) },
  { id: "prod-1e60", name: "Produção: 1 Nd", description: "Produza 1 novemdecilhão no total (lifetime)", points: 195, check: (s) => s.totalProducedLifetime.gte(1e60) },
  { id: "prod-1e63", name: "Produção: 1 Vg", description: "Produza 1 vigecilhão no total (lifetime)", points: 205, check: (s) => s.totalProducedLifetime.gte(1e63) },
  { id: "prod-1e66", name: "Produção: 1 Uvg", description: "Produza 1 unvigecilhão no total (lifetime)", points: 215, check: (s) => s.totalProducedLifetime.gte(1e66) },
  { id: "prod-1e69", name: "Produção: 1 Dvg", description: "Produza 1 dovigecilhão no total (lifetime)", points: 225, check: (s) => s.totalProducedLifetime.gte(1e69) },
  { id: "prod-1e72", name: "Produção: 1 Tvg", description: "Produza 1 trevigecilhão no total (lifetime)", points: 235, check: (s) => s.totalProducedLifetime.gte(1e72) },
  { id: "prod-1e75", name: "Produção: 1 Qvg", description: "Produza 1 quatrovigecilhão no total (lifetime)", points: 245, check: (s) => s.totalProducedLifetime.gte(1e75) },
  { id: "prod-1e78", name: "Produção: 1 Qivg", description: "Produza 1 quinvigecilhão no total (lifetime)", points: 255, check: (s) => s.totalProducedLifetime.gte(1e78) },
  { id: "prod-1e81", name: "Produção: 1 Svg", description: "Produza 1 sexvigecilhão no total (lifetime)", points: 265, check: (s) => s.totalProducedLifetime.gte(1e81) },
  { id: "prod-1e84", name: "Produção: 1 Spvg", description: "Produza 1 septenvigecilhão no total (lifetime)", points: 275, check: (s) => s.totalProducedLifetime.gte(1e84) },
  { id: "prod-1e87", name: "Produção: 1 Ovg", description: "Produza 1 octovigecilhão no total (lifetime)", points: 285, check: (s) => s.totalProducedLifetime.gte(1e87) },
  { id: "prod-1e90", name: "Produção: 1 Nvg", description: "Produza 1 novemvigecilhão no total (lifetime)", points: 295, check: (s) => s.totalProducedLifetime.gte(1e90) },
  { id: "prod-1e93", name: "Produção: 1 Tg", description: "Produza 1 trigecilhão no total (lifetime)", points: 305, check: (s) => s.totalProducedLifetime.gte(1e93) },
  { id: "prod-1e96", name: "Produção: 1 Utg", description: "Produza 1 untrigecilhão no total (lifetime)", points: 315, check: (s) => s.totalProducedLifetime.gte(1e96) },
  { id: "prod-1e99", name: "Produção: 1 Dtg", description: "Produza 1 dotrigecilhão no total (lifetime)", points: 325, check: (s) => s.totalProducedLifetime.gte(1e99) },
  { id: "prod-1e100", name: "Produção: 1e100", description: "Produza 1e100 no total (lifetime)", points: 400, check: (s) => s.totalProducedLifetime.gte(1e100) },

  // —— Tempo de jogo ——
  { id: "tempo-1h", name: "Uma hora", description: "Jogue por 1 hora no total", points: 10, check: (s) => s.totalPlayTimeSeconds >= 3600 },
  { id: "tempo-5h", name: "Cinco horas", description: "Jogue por 5 horas no total", points: 15, check: (s) => s.totalPlayTimeSeconds >= 5 * 3600 },
  { id: "tempo-10h", name: "Dez horas", description: "Jogue por 10 horas no total", points: 20, check: (s) => s.totalPlayTimeSeconds >= 10 * 3600 },
  { id: "tempo-24h", name: "Um dia", description: "Jogue por 24 horas no total", points: 30, check: (s) => s.totalPlayTimeSeconds >= 24 * 3600 },
  { id: "tempo-50h", name: "Cinquenta horas", description: "Jogue por 50 horas no total", points: 40, check: (s) => s.totalPlayTimeSeconds >= 50 * 3600 },
  { id: "tempo-100h", name: "Cem horas", description: "Jogue por 100 horas no total", points: 50, check: (s) => s.totalPlayTimeSeconds >= 100 * 3600 },
  { id: "tempo-250h", name: "Duzentas e cinquenta horas", description: "Jogue por 250 horas no total", points: 65, check: (s) => s.totalPlayTimeSeconds >= 250 * 3600 },
  { id: "tempo-500h", name: "Quinhentas horas", description: "Jogue por 500 horas no total", points: 80, check: (s) => s.totalPlayTimeSeconds >= 500 * 3600 },
  { id: "tempo-1000h", name: "Mil horas", description: "Jogue por 1.000 horas no total", points: 100, check: (s) => s.totalPlayTimeSeconds >= 1000 * 3600 },

  // —— Compras manuais (clique) ——
  { id: "comp-10", name: "Comprador dedicado", description: "Compre 10 geradores manualmente (clique)", points: 8, check: (s) => s.geradoresCompradosManual >= 10 },
  { id: "comp-50", name: "Comprador frequente", description: "Compre 50 geradores manualmente (clique)", points: 12, check: (s) => s.geradoresCompradosManual >= 50 },
  { id: "comp-100", name: "Comprador assíduo", description: "Compre 100 geradores manualmente (clique)", points: 18, check: (s) => s.geradoresCompradosManual >= 100 },
  { id: "comp-250", name: "Comprador incansável", description: "Compre 250 geradores manualmente (clique)", points: 25, check: (s) => s.geradoresCompradosManual >= 250 },
  { id: "comp-500", name: "Comprador obcecado", description: "Compre 500 geradores manualmente (clique)", points: 35, check: (s) => s.geradoresCompradosManual >= 500 },
  { id: "comp-1k", name: "Mestre do clique", description: "Compre 1.000 geradores manualmente (clique)", points: 45, check: (s) => s.geradoresCompradosManual >= 1000 },
  { id: "comp-2500", name: "Lenda do clique", description: "Compre 2.500 geradores manualmente (clique)", points: 60, check: (s) => s.geradoresCompradosManual >= 2500 },
  { id: "comp-5k", name: "Deus do clique", description: "Compre 5.000 geradores manualmente (clique)", points: 75, check: (s) => s.geradoresCompradosManual >= 5000 },
  { id: "comp-10k", name: "Transcendência do clique", description: "Compre 10.000 geradores manualmente (clique)", points: 95, check: (s) => s.geradoresCompradosManual >= 10000 },

  // —— Melhorias de produção (total) ——
  { id: "melh-10", name: "Dez melhorias", description: "Compre 10 melhorias de produção no total", points: 15, check: (s) => sum(s.upgrades) >= 10 },
  { id: "melh-25", name: "Vinte e cinco melhorias", description: "Compre 25 melhorias de produção no total", points: 22, check: (s) => sum(s.upgrades) >= 25 },
  { id: "melh-50", name: "Cinquenta melhorias", description: "Compre 50 melhorias de produção no total", points: 30, check: (s) => sum(s.upgrades) >= 50 },
  { id: "melh-100", name: "Cem melhorias", description: "Compre 100 melhorias de produção no total", points: 40, check: (s) => sum(s.upgrades) >= 100 },
  { id: "melh-250", name: "250 melhorias", description: "Compre 250 melhorias de produção no total", points: 55, check: (s) => sum(s.upgrades) >= 250 },
  { id: "melh-500", name: "Quinhentas melhorias", description: "Compre 500 melhorias de produção no total", points: 70, check: (s) => sum(s.upgrades) >= 500 },
  { id: "melh-1k", name: "Mil melhorias", description: "Compre 1.000 melhorias de produção no total", points: 90, check: (s) => sum(s.upgrades) >= 1000 },
  { id: "melh-2500", name: "2.500 melhorias", description: "Compre 2.500 melhorias de produção no total", points: 110, check: (s) => sum(s.upgrades) >= 2500 },
  { id: "melh-5k", name: "Cinco mil melhorias", description: "Compre 5.000 melhorias de produção no total", points: 135, check: (s) => sum(s.upgrades) >= 5000 },

  // —— Melhorias de velocidade (total) ——
  { id: "vel-10", name: "Dez velocidades", description: "Compre 10 melhorias de velocidade no total", points: 15, check: (s) => sum(s.speedUpgrades) >= 10 },
  { id: "vel-25", name: "Vinte e cinco velocidades", description: "Compre 25 melhorias de velocidade no total", points: 22, check: (s) => sum(s.speedUpgrades) >= 25 },
  { id: "vel-50", name: "Cinquenta velocidades", description: "Compre 50 melhorias de velocidade no total", points: 30, check: (s) => sum(s.speedUpgrades) >= 50 },
  { id: "vel-100", name: "Cem velocidades", description: "Compre 100 melhorias de velocidade no total", points: 40, check: (s) => sum(s.speedUpgrades) >= 100 },
  { id: "vel-250", name: "250 velocidades", description: "Compre 250 melhorias de velocidade no total", points: 55, check: (s) => sum(s.speedUpgrades) >= 250 },
  { id: "vel-500", name: "Quinhentas velocidades", description: "Compre 500 melhorias de velocidade no total", points: 70, check: (s) => sum(s.speedUpgrades) >= 500 },
  { id: "vel-1k", name: "Mil velocidades", description: "Compre 1.000 melhorias de velocidade no total", points: 90, check: (s) => sum(s.speedUpgrades) >= 1000 },
  { id: "vel-2500", name: "2.500 velocidades", description: "Compre 2.500 melhorias de velocidade no total", points: 110, check: (s) => sum(s.speedUpgrades) >= 2500 },
  { id: "vel-5k", name: "Cinco mil velocidades", description: "Compre 5.000 melhorias de velocidade no total", points: 135, check: (s) => sum(s.speedUpgrades) >= 5000 },
]

/** Set de IDs válidos (existentes em ACHIEVEMENTS). Útil para filtrar save antigo. */
const VALID_ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map((a) => a.id))

/** Filtra apenas IDs que existem na lista atual de conquistas (evita IDs de versões antigas). */
export function filterValidAchievementIds(ids: string[]): string[] {
  return ids.filter((id) => VALID_ACHIEVEMENT_IDS.has(id))
}

/** Retorna os IDs das conquistas que estão desbloqueadas com o estado atual e ainda não estavam na lista. */
export function getNewlyUnlockedAchievementIds(
  state: AchievementCheckState,
  alreadyUnlockedIds: string[]
): string[] {
  const set = new Set(alreadyUnlockedIds)
  const newly: string[] = []
  for (const a of ACHIEVEMENTS) {
    if (set.has(a.id)) continue
    if (a.check(state)) newly.push(a.id)
  }
  return newly
}

/** Soma dos pontos das conquistas desbloqueadas */
export function totalAchievementPoints(unlockedIds: string[]): number {
  const set = new Set(unlockedIds)
  return ACHIEVEMENTS.filter((a) => set.has(a.id)).reduce((sum, a) => sum + a.points, 0)
}

/** Categorias para abas na página de conquistas (ordem de exibição) */
export const ACHIEVEMENT_CATEGORIES = [
  { id: "primeiros-passos", label: "Primeiros passos" },
  { id: "recurso", label: "Recurso" },
  { id: "unidades-geradores", label: "Unidades de geradores" },
  { id: "gerador-especifico", label: "Geradores específicos" },
  { id: "producao-total", label: "Produção total" },
  { id: "tempo-jogo", label: "Tempo de jogo" },
  { id: "compras-manuais", label: "Compras manuais" },
  { id: "melhorias-producao", label: "Melhorias de produção" },
  { id: "melhorias-velocidade", label: "Melhorias de velocidade" },
] as const

/** Retorna o id da categoria da conquista a partir do id da conquista. */
export function getAchievementCategoryId(achievementId: string): string {
  if (achievementId.startsWith("primeiro") || achievementId.startsWith("primeira")) return "primeiros-passos"
  if (achievementId.startsWith("rec-")) return "recurso"
  if (achievementId.startsWith("unid-")) return "unidades-geradores"
  if (/^g\d+$/.test(achievementId)) return "gerador-especifico"
  if (achievementId.startsWith("prod-")) return "producao-total"
  if (achievementId.startsWith("tempo-")) return "tempo-jogo"
  if (achievementId.startsWith("comp-")) return "compras-manuais"
  if (achievementId.startsWith("melh-")) return "melhorias-producao"
  if (achievementId.startsWith("vel-")) return "melhorias-velocidade"
  return "primeiros-passos"
}
