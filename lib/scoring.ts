import type { GameResult, PlayerResult, Achievement } from "@/types/game"

export class ScoringSystem {
  static readonly POINTS_PER_PAIR = 100

  static calculateScore(
    matches: number,
    streak: number,
    timeBonus: number,
    difficulty: "easy" | "medium" | "hard",
    perfectMatches: number,
  ): number {
    const baseScore = matches * this.POINTS_PER_PAIR
    const perfectBonus = perfectMatches * 50 // 50 bonus points per perfect match
    return baseScore + perfectBonus
  }

  static calculateTimeBonus(timeElapsed: number, totalPairs: number): number {
    return 0
  }

  static getAchievements(): Achievement[] {
    return [
      {
        id: "first_win",
        name: "Primera Victoria",
        description: "Gana tu primer juego",
        icon: "🏆",
        condition: (result, player) => player.rank === 1,
        rarity: "common",
      },
      {
        id: "perfect_memory",
        name: "Memoria Perfecta",
        description: "Encuentra todas las parejas",
        icon: "🧠",
        condition: (result, player) => player.matches === result.pairs,
        rarity: "epic",
      },
      {
        id: "streak_master",
        name: "Maestro de Rachas",
        description: "Consigue una racha de 5 o más",
        icon: "🔥",
        condition: (result, player) => player.streak >= 5,
        rarity: "rare",
      },
      {
        id: "pair_collector",
        name: "Coleccionista de Parejas",
        description: "Encuentra 10 o más parejas en una partida",
        icon: "💎",
        condition: (result, player) => player.matches >= 10,
        rarity: "epic",
      },
    ]
  }

  static checkAchievements(result: GameResult, playerResult: PlayerResult): Achievement[] {
    const achievements = this.getAchievements()
    return achievements.filter((achievement) => achievement.condition(result, playerResult))
  }
}
