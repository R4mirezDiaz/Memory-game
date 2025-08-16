"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  RotateCcw,
  Pause,
  Play,
  Trophy,
  Clock,
  Settings,
  Moon,
  Sun,
  Users,
  Wifi,
  WifiOff,
  Crown,
  AlertCircle,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { GameConfig, ImagePackage } from "@/types/game"
import { useMultiplayerMemoryGame } from "@/hooks/use-multiplayer-memory-game"
import { useWebSocket } from "@/contexts/websocket-context"
import { useAudio } from "@/hooks/use-audio"
import { useTheme } from "@/contexts/theme-context"
import { GameCard } from "./game-card"
import { GameOverDialog } from "./game-over-dialog"
import { AnimatedProgress } from "./animated-progress"
import { StreakIndicator } from "./streak-indicator"
import { ParticleEffect } from "./particle-effect"
import { ConfettiExplosion } from "./confetti-explosion"
import { AudioControls } from "./audio-controls"
import { TurnIndicator } from "./turn-indicator"

interface MultiplayerMemoryGameProps {
  config: GameConfig
  imagePackage: ImagePackage
  onBack: () => void
}

export function MultiplayerMemoryGame({ config, imagePackage, onBack }: MultiplayerMemoryGameProps) {
  const { playButtonClick } = useAudio()
  const { theme, toggleTheme } = useTheme()
  const { isConnected, players, isHost, playerId } = useWebSocket()

  const [previousScores, setPreviousScores] = useState<Record<string, number>>({})
  const [showParticles, setShowParticles] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [lastMatchedPairs, setLastMatchedPairs] = useState(0)
  const [showRoleInfo, setShowRoleInfo] = useState(false)

  const {
    gameState,
    timeElapsed,
    flipCard,
    initializeGame,
    getCurrentPlayer,
    getWinners,
    getPlayerDetails,
    resetGame,
    togglePause,
    isMyTurn,
  } = useMultiplayerMemoryGame(config, imagePackage)

  const calculateCardDimensions = () => {
    const totalCards = config.pairs * 2
    const headerHeight = isHost ? 220 : 200 // Different heights for host/guest
    const padding = 8
    const availableWidth = window.innerWidth - padding
    const availableHeight = window.innerHeight - headerHeight - padding

    let bestLayout = { cols: 1, rows: totalCards, cardSize: 0, efficiency: 0 }

    for (let cols = 1; cols <= totalCards; cols++) {
      const rows = Math.ceil(totalCards / cols)
      const maxCardWidth = Math.floor(availableWidth / cols) - 4
      const maxCardHeight = Math.floor(availableHeight / rows) - 4
      const cardSize = Math.min(maxCardWidth, maxCardHeight, 200)

      if (cardSize < 50) continue

      const efficiency = cardSize * (1 + (totalCards - rows) * 0.1)

      if (efficiency > bestLayout.efficiency) {
        bestLayout = { cols, rows, cardSize, efficiency }
      }
    }

    return {
      cardSize: Math.max(bestLayout.cardSize, 60),
      cols: bestLayout.cols,
      rows: bestLayout.rows,
      gridWidth: bestLayout.cols * bestLayout.cardSize + (bestLayout.cols - 1) * 4,
      gridHeight: bestLayout.rows * bestLayout.cardSize + (bestLayout.rows - 1) * 4,
    }
  }

  const [cardDimensions, setCardDimensions] = useState(() => calculateCardDimensions())

  useEffect(() => {
    const handleResize = () => {
      setCardDimensions(calculateCardDimensions())
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [config.pairs, isHost])

  useEffect(() => {
    if (isHost) {
      initializeGame()
    }
  }, [isHost, initializeGame])

  // Show role info for first few seconds
  useEffect(() => {
    setShowRoleInfo(true)
    const timer = setTimeout(() => setShowRoleInfo(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    setPreviousScores(gameState.scores)
  }, [gameState.scores])

  useEffect(() => {
    if (gameState.matchedPairs.length > lastMatchedPairs) {
      setShowParticles(true)
      setTimeout(() => setShowParticles(false), 100)
    }
    setLastMatchedPairs(gameState.matchedPairs.length)
  }, [gameState.matchedPairs.length, lastMatchedPairs])

  useEffect(() => {
    if (gameState.gameStatus === "finished") {
      setShowConfetti(true)
    }
  }, [gameState.gameStatus])

  if (!config || !config.players || !imagePackage || !imagePackage.images) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 p-4 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold text-white mb-4">Error de Configuración</h2>
            <p className="text-white/80 mb-6">La configuración del juego o el paquete de imágenes no es válido.</p>
            <Button onClick={onBack} className="bg-blue-500 hover:bg-blue-600 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progress = (gameState.matchedPairs.length / config.pairs) * 100
  const winners = getWinners()
  const playerDetails = getPlayerDetails()
  const currentPlayer = getCurrentPlayer()
  const currentPlayerObj = players.find((p) => p.name === currentPlayer)
  const myPlayer = players.find((p) => p.id === playerId)

  const handleBack = () => {
    playButtonClick()
    onBack()
  }

  const handleTogglePause = () => {
    if (!isHost) return
    playButtonClick()
    togglePause()
  }

  const handleResetGame = () => {
    if (!isHost) return
    playButtonClick()
    resetGame()
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 bg-black/20 backdrop-blur-sm">
        <div className="p-1 sm:p-2">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="border-white/20 text-white hover:bg-white/10 bg-transparent h-7 px-2 text-xs"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                {isHost ? "Finalizar Sala" : "Salir de Sala"}
              </Button>
              <div className="hidden sm:block">
                <h1 className="text-xs font-bold text-white truncate">{imagePackage.name}</h1>
                <div className="flex items-center gap-2">
                  <p className="text-white/80 text-xs">
                    {config.pairs} parejas • {players.length} jugador{players.length > 1 ? "es" : ""}
                  </p>
                  <div className="flex items-center gap-1">
                    {isConnected ? (
                      <Wifi className="w-3 h-3 text-green-300" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-red-300" />
                    )}
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        isHost
                          ? "bg-yellow-500/20 text-yellow-200 border-yellow-400/30"
                          : "bg-blue-500/20 text-blue-200 border-blue-400/30"
                      }`}
                    >
                      {isHost ? <Crown className="w-2 h-2 mr-1" /> : <Users className="w-2 h-2 mr-1" />}
                      {isHost ? "Anfitrión" : "Invitado"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <div className="flex items-center gap-1 bg-white/10 rounded px-1 sm:px-2 py-1">
                <Clock className="w-3 h-3 text-white" />
                <span className="text-white font-mono text-xs">{formatTime(timeElapsed)}</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 rounded px-1 sm:px-2 py-1">
                <Trophy className="w-3 h-3 text-white" />
                <span className="text-white text-xs">
                  {gameState.matchedPairs.length}/{config.pairs}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                onClick={toggleTheme}
                className="border-white/20 text-white hover:bg-white/10 bg-transparent h-7 w-7 p-0"
              >
                {theme === "light" ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
              </Button>

              {/* Audio controls available to all players */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 bg-transparent h-7 w-7 p-0"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-transparent border-none p-0" align="end">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      {isHost ? "Configuración del Anfitrión" : "Configuración del Invitado"}
                    </h3>
                    <AudioControls />
                    {!isHost && (
                      <div className="mt-3 pt-3 border-t border-white/20">
                        <p className="text-white/60 text-xs">Solo el anfitrión puede pausar o reiniciar el juego</p>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Host-only controls */}
              {isHost && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleTogglePause}
                    className="border-yellow-400/30 text-yellow-200 hover:bg-yellow-500/10 bg-transparent h-7 w-7 p-0"
                    title="Solo el anfitrión puede pausar"
                  >
                    {gameState.gameStatus === "playing" ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResetGame}
                    className="border-yellow-400/30 text-yellow-200 hover:bg-yellow-500/10 bg-transparent h-7 w-7 p-0"
                    title="Solo el anfitrión puede reiniciar"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </>
              )}

              {/* Guest info button */}
              {!isHost && (
                <Button
                  variant="outline"
                  onClick={() => setShowRoleInfo(!showRoleInfo)}
                  className="border-blue-400/30 text-blue-200 hover:bg-blue-500/10 bg-transparent h-7 w-7 p-0"
                  title="Información del invitado"
                >
                  <Info className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="px-1 sm:px-2 pb-1">
          <div className="bg-white/10 rounded-full h-1.5">
            <AnimatedProgress value={progress} />
          </div>
        </div>

        {showRoleInfo && myPlayer && (
          <div className="px-1 sm:px-2 pb-2">
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert
                className={`
                ${isHost ? "bg-yellow-500/10 border-yellow-400/30" : "bg-blue-500/10 border-blue-400/30"}
              `}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-white">
                  {isHost ? (
                    <span>
                      <strong>Eres el anfitrión:</strong> Puedes pausar, reiniciar y controlar el flujo del juego.
                    </span>
                  ) : (
                    <span>
                      <strong>Eres un invitado:</strong> Espera tu turno para jugar. El anfitrión controla el juego.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            </motion.div>
          </div>
        )}

        {gameState.gameStatus === "playing" && currentPlayerObj && (
          <div className="px-1 sm:px-2 pb-2">
            <TurnIndicator
              currentPlayerName={currentPlayer}
              currentPlayerColor={currentPlayerObj.color}
              isMyTurn={isMyTurn}
              isHost={currentPlayerObj.isHost}
              disabled={!isConnected}
            />
          </div>
        )}

        <div className="px-1 sm:px-2 pb-1">
          <div className="flex gap-1 overflow-x-auto">
            {playerDetails.map((player) => (
              <div
                key={player.name}
                className={`flex items-center gap-1 bg-white/10 rounded px-1 sm:px-2 py-1 min-w-0 transition-all duration-300 ${
                  player.isCurrentPlayer ? "ring-2 ring-yellow-400 bg-yellow-400/20" : ""
                }`}
              >
                <div
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 transition-all duration-300 ${
                    player.isCurrentPlayer ? "ring-1 ring-white animate-pulse" : ""
                  }`}
                  style={{ backgroundColor: player.color }}
                />
                <span className="text-white text-xs truncate max-w-12 sm:max-w-16">{player.name}</span>
                {/* Role indicator for each player */}
                {players.find((p) => p.name === player.name)?.isHost && <Crown className="w-2 h-2 text-yellow-400" />}
                <span className="text-white font-bold text-xs">{player.matches}</span>
                {player.streak > 0 && (
                  <StreakIndicator
                    streak={player.streak}
                    isActive={player.isCurrentPlayer && gameState.gameStatus === "playing"}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-1 min-h-0">
        <div
          className={`grid gap-1 transition-all duration-300 ${
            !isMyTurn && gameState.gameStatus === "playing" ? "opacity-60 pointer-events-none" : ""
          }`}
          style={{
            gridTemplateColumns: `repeat(${cardDimensions.cols}, ${cardDimensions.cardSize}px)`,
            gridTemplateRows: `repeat(${cardDimensions.rows}, ${cardDimensions.cardSize}px)`,
            width: `${cardDimensions.gridWidth}px`,
            height: `${cardDimensions.gridHeight}px`,
          }}
        >
          {gameState.cards.map((card, index) => (
            <GameCard
              key={card.id}
              card={card}
              index={index}
              onClick={() => flipCard(card.id)}
              disabled={
                gameState.gameStatus !== "playing" ||
                gameState.flippedCards.length >= 2 ||
                card.isFlipped ||
                card.isMatched ||
                !isMyTurn ||
                !isConnected
              }
              cardSize={cardDimensions.cardSize}
            />
          ))}
        </div>
      </div>

      {!isConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40"
        >
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-6 text-center max-w-md">
            <CardContent>
              <WifiOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Conexión Perdida</h2>
              <p className="text-white/80 mb-4">
                {isHost
                  ? "Como anfitrión, el juego se pausará hasta que te reconectes."
                  : "Intentando reconectar... El anfitrión mantiene el juego activo."}
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto"></div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <AnimatePresence>
        {gameState.gameStatus === "setup" && gameState.cards.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-full max-w-sm"
            >
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6 sm:p-8 text-center space-y-4">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <Pause className="w-12 h-12 sm:w-16 sm:h-16 text-white mx-auto mb-4" />
                  </motion.div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                    {isHost ? "Juego Pausado por el Anfitrión" : "Juego Pausado"}
                  </h2>

                  <div className="mb-6">
                    <AudioControls showBackgroundMusic={false} />
                  </div>

                  {isHost ? (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleTogglePause}
                        className="bg-green-500 hover:bg-green-600 text-white h-12 px-6 text-base w-full sm:w-auto"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Continuar Juego
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="text-center">
                      <p className="text-white/80 text-sm mb-4">Esperando que el anfitrión reanude el juego...</p>
                      <div className="animate-pulse">
                        <Clock className="w-6 h-6 text-white/60 mx-auto" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameState.gameStatus === "finished" && (
          <GameOverDialog
            winners={winners}
            scores={gameState.scores}
            timeElapsed={timeElapsed}
            moves={gameState.moves}
            streaks={gameState.streaks}
            bonusPoints={gameState.bonusPoints}
            perfectMatches={gameState.perfectMatches}
            onPlayAgain={isHost ? resetGame : undefined} // Only host can restart
            onExit={onBack}
            isMultiplayer={true}
            isHost={isHost}
          />
        )}
      </AnimatePresence>

      <ParticleEffect trigger={showParticles} />
      <ConfettiExplosion trigger={showConfetti} />
    </div>
  )
}
