import type { GameResult, PlayerStats } from "@/types/game"

const RESULTS_KEY = "memorama-results"
const STATS_KEY = "memorama-stats"

export class StatsStorage {
  static saveGameResult(result: GameResult): void {
    if (typeof window === "undefined") return

    try {
      const results = this.getGameResults()
      results.push(result)

      // Keep only last 100 results
      if (results.length > 100) {
        results.splice(0, results.length - 100)
      }

      localStorage.setItem(RESULTS_KEY, JSON.stringify(results))
      this.updatePlayerStats(result)
    } catch (error) {
      console.error("Error saving game result:", error)
    }
  }

  static getGameResults(): GameResult[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(RESULTS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static getPlayerStats(playerName: string): PlayerStats {
    if (typeof window === "undefined") {
      return this.getDefaultStats()
    }

    try {
      const stored = localStorage.getItem(STATS_KEY)
      const allStats = stored ? JSON.parse(stored) : {}
      return allStats[playerName] || this.getDefaultStats()
    } catch {
      return this.getDefaultStats()
    }
  }

  static updatePlayerStats(result: GameResult): void {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(STATS_KEY)
      const allStats = stored ? JSON.parse(stored) : {}

      result.players.forEach((playerResult) => {
        const currentStats = allStats[playerResult.name] || this.getDefaultStats()

        currentStats.totalGames += 1
        if (playerResult.rank === 1) currentStats.totalWins += 1
        currentStats.totalMatches += playerResult.matches

        if (result.totalTime < currentStats.bestTime || currentStats.bestTime === 0) {
          currentStats.bestTime = result.totalTime
        }

        if (playerResult.score > currentStats.bestScore) {
          currentStats.bestScore = playerResult.score
        }

        if (playerResult.streak > currentStats.longestStreak) {
          currentStats.longestStreak = playerResult.streak
        }

        currentStats.averageScore = Math.floor(
          (currentStats.averageScore * (currentStats.totalGames - 1) + playerResult.score) / currentStats.totalGames,
        )

        // Update favorite package (most played)
        currentStats.favoritePackage = result.packageName

        allStats[playerResult.name] = currentStats
      })

      localStorage.setItem(STATS_KEY, JSON.stringify(allStats))
    } catch (error) {
      console.error("Error updating player stats:", error)
    }
  }

  static getLeaderboard(limit = 10): Array<{ name: string; stats: PlayerStats }> {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(STATS_KEY)
      const allStats = stored ? JSON.parse(stored) : {}

      return Object.entries(allStats)
        .map(([name, stats]) => ({ name, stats: stats as PlayerStats }))
        .sort((a, b) => b.stats.bestScore - a.stats.bestScore)
        .slice(0, limit)
    } catch {
      return []
    }
  }

  private static getDefaultStats(): PlayerStats {
    return {
      totalGames: 0,
      totalWins: 0,
      totalMatches: 0,
      bestTime: 0,
      bestScore: 0,
      longestStreak: 0,
      achievements: [],
      averageScore: 0,
      favoritePackage: "",
    }
  }
}
