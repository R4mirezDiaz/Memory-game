"use client"

import { Trophy, Clock, MousePointer, RotateCcw, ArrowLeft, Star, Zap, Target, Crown, Users, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScoringSystem } from "@/lib/scoring"
import { StatsStorage } from "@/lib/stats-storage"

interface GameOverDialogProps {
  winners: string[]
  scores: Record<string, number>
  timeElapsed: number
  moves: number
  onPlayAgain?: () => void // Made optional for guests
  onExit: () => void
  streaks?: Record<string, number>
  bonusPoints?: Record<string, number>
  perfectMatches?: Record<string, number>
  isMultiplayer?: boolean // Added multiplayer flag
  isHost?: boolean // Added host flag
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
  isMultiplayer = false,
  isHost = false,
}: GameOverDialogProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const isMultiplayerGame = Object.keys(scores).length > 1 || isMultiplayer
  const achievements = ScoringSystem.getAchievements()

  const recentAchievements = winners.flatMap((winner) => {
    const stats = StatsStorage.getPlayerStats(winner)
    return achievements.filter((achievement) => stats.achievements.includes(achievement.id)).slice(-3)
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
                {isMultiplayerGame && <span className="text-sm block mt-1">en esta partida multijugador</span>}
              </p>
            ) : (
              <p>
                <span className="font-semibold text-yellow-400">{winners.join(", ")}</span> han empatado
                {isMultiplayerGame && <span className="text-sm block mt-1">en esta partida multijugador</span>}
              </p>
            )}
          </div>

          {isMultiplayerGame && (
            <div className="mt-3">
              <Badge
                variant="secondary"
                className={`
                  ${
                    isHost
                      ? "bg-yellow-500/20 text-yellow-200 border-yellow-400/30"
                      : "bg-blue-500/20 text-blue-200 border-blue-400/30"
                  }
                `}
              >
                {isHost ? <Crown className="w-3 h-3 mr-1" /> : <Users className="w-3 h-3 mr-1" />}
                {isHost ? "Anfitrión" : "Invitado"}
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {isMultiplayerGame && !isHost && (
            <Alert className="bg-blue-500/10 border-blue-400/30">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-blue-200">
                Solo el anfitrión puede iniciar una nueva partida. Puedes salir y crear tu propia sala.
              </AlertDescription>
            </Alert>
          )}

          {/* Game Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white/10 rounded-lg p-3">
              <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-white/80 text-sm">Tiempo</p>
              <p className="text-white font-bold">{formatTime(timeElapsed)}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <MousePointer className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-white/80 text-sm">Movimientos</p>
              <p className="text-white font-bold">{moves}</p>
            </div>
          </div>

          {/* Scores */}
          {isMultiplayerGame && (
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
                        <Badge variant="outline" className="text-xs border-white/20 text-white/60">
                          #{index + 1}
                        </Badge>
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

          <div className="flex gap-3">
            {/* Only show play again button for hosts or single player */}
            {(!isMultiplayerGame || isHost) && onPlayAgain && (
              <Button onClick={onPlayAgain} className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                <RotateCcw className="w-4 h-4 mr-2" />
                {isMultiplayerGame ? "Nueva Partida" : "Jugar de Nuevo"}
              </Button>
            )}

            <Button
              onClick={onExit}
              variant="outline"
              className={`${(!isMultiplayerGame || isHost) && onPlayAgain ? "flex-1" : "w-full"} border-white/20 text-white hover:bg-white/10 bg-transparent`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isMultiplayerGame ? (isHost ? "Cerrar Sala" : "Salir de Sala") : "Salir"}
            </Button>
          </div>

          {isMultiplayerGame && (
            <div className="text-center pt-2 border-t border-white/20">
              <p className="text-white/60 text-xs">
                {isHost
                  ? "Como anfitrión, puedes iniciar una nueva partida o cerrar la sala"
                  : "Gracias por participar en esta partida multijugador"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
