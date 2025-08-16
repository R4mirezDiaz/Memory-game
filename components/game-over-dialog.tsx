"use client"

import { Trophy, Clock, MousePointer, RotateCcw, ArrowLeft, Star, Zap, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScoringSystem } from "@/lib/scoring"
import { StatsStorage } from "@/lib/stats-storage"

interface GameOverDialogProps {
  winners: string[]
  scores: Record<string, number>
  timeElapsed: number
  moves: number
  onPlayAgain: () => void
  onExit: () => void
  streaks?: Record<string, number>
  bonusPoints?: Record<string, number>
  perfectMatches?: Record<string, number>
}

export function GameOverDialog({
  winners,
  scores,
  timeElapsed,
  moves,
  onPlayAgain,
  onExit,
  streaks = {},
  bonusPoints = {},
  perfectMatches = {},
}: GameOverDialogProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const isMultiplayer = Object.keys(scores).length > 1
  const achievements = ScoringSystem.getAchievements()

  const recentAchievements = winners.flatMap((winner) => {
    const stats = StatsStorage.getPlayerStats(winner)
    return achievements.filter((achievement) => stats.achievements.includes(achievement.id)).slice(-3) // Show last 3 achievements
  })

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Trophy className="w-16 h-16 text-yellow-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {winners.length === 1 ? "¡Felicidades!" : "¡Empate!"}
          </CardTitle>
          <div className="text-white/80">
            {winners.length === 1 ? (
              <p>
                <span className="font-semibold text-yellow-400">{winners[0]}</span> ha ganado
              </p>
            ) : (
              <p>
                <span className="font-semibold text-yellow-400">{winners.join(", ")}</span> han empatado
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Game Stats */}
          

          {/* Scores */}
          {isMultiplayer && (
            <div className="space-y-2">
              <h3 className="text-white font-semibold text-center">Puntuaciones Finales</h3>
              <div className="space-y-2">
                {Object.entries(scores)
                  .sort(([, a], [, b]) => b - a)
                  .map(([player, score], index) => (
                    <div
                      key={player}
                      className={`flex justify-between items-center p-3 rounded ${
                        winners.includes(player) ? "bg-yellow-500/20" : "bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {index === 0 && winners.includes(player) && <Trophy className="w-4 h-4 text-yellow-400" />}
                        <span className="text-white font-semibold">{player}</span>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="secondary"
                          className={
                            winners.includes(player) ? "bg-yellow-500/20 text-yellow-300" : "bg-white/20 text-white"
                          }
                        >
                          {score} pts
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Desglose de Puntuación */}
          <div className="space-y-3">
            <h3 className="text-white font-semibold">Desglose de Puntuación</h3>
            {Object.entries(scores).map(([player, score]) => (
              <div key={player} className="bg-white/10 rounded-lg p-4 px-2 py-2">
                <h4 className="text-white font-semibold mb-3">{player}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-400" />
                    <span className="text-white/80">Puntuación Total:</span>
                    <span className="text-white font-semibold">{score}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-400" />
                    <span className="text-white/80">Racha Máxima:</span>
                    <span className="text-white font-semibold">{streaks[player] || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-400" />
                    <span className="text-white/80">Puntos Bonus:</span>
                    <span className="text-white font-semibold">{bonusPoints[player] || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-white/80">Parejas Perfectas:</span>
                    <span className="text-white font-semibold">{perfectMatches[player] || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Logros Recientes */}
          

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={onPlayAgain} className="flex-1 bg-green-500 hover:bg-green-600 text-white">
              <RotateCcw className="w-4 h-4 mr-2" />
              Jugar de Nuevo
            </Button>
            <Button
              onClick={onExit}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
