"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, RotateCcw, Pause, Play, Trophy, Clock, User, Settings, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { GameConfig, ImagePackage } from "@/types/game"
import { useMemoryGame } from "@/hooks/use-memory-game"
import { useAudio } from "@/hooks/use-audio"
import { useTheme } from "@/contexts/theme-context"
import { GameCard } from "./game-card"
import { GameOverDialog } from "./game-over-dialog"
import { AnimatedProgress } from "./animated-progress"
import { StreakIndicator } from "./streak-indicator"
import { ParticleEffect } from "./particle-effect"
import { ConfettiExplosion } from "./confetti-explosion"
import { AudioControls } from "./audio-controls"
import { PLAYER_COLORS } from "@/lib/player-storage"

interface MemoryGameProps {
  config: GameConfig
  imagePackage: ImagePackage
  onBack: () => void
}

export function MemoryGame({ config, imagePackage, onBack }: MemoryGameProps) {
  const { playButtonClick, startBackgroundMusic } = useAudio()
  const { theme, toggleTheme } = useTheme()

  const [previousScores, setPreviousScores] = useState<Record<string, number>>({})
  const [showParticles, setShowParticles] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [lastMatchedPairs, setLastMatchedPairs] = useState(0)

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
  } = useMemoryGame(config, imagePackage)

  const calculateCardDimensions = () => {
    const totalCards = config.pairs * 2
    const aspectRatio = 1 // Square cards

    // Get available space (accounting for header and padding)
    const headerHeight = 120 // Approximate header height
    const padding = 8 // Reduced padding
    const availableWidth = window.innerWidth - padding
    const availableHeight = window.innerHeight - headerHeight - padding

    let bestLayout = { cols: 1, rows: totalCards, cardSize: 0, efficiency: 0 }

    // Try different column counts and find the most efficient layout
    for (let cols = 1; cols <= totalCards; cols++) {
      const rows = Math.ceil(totalCards / cols)

      // Calculate card size for this layout
      const maxCardWidth = Math.floor(availableWidth / cols) - 4 // Reduced gap
      const maxCardHeight = Math.floor(availableHeight / rows) - 4 // Reduced gap
      const cardSize = Math.min(maxCardWidth, maxCardHeight, 200) // Max 200px

      if (cardSize < 50) continue // Skip if cards would be too small

      // Calculate efficiency (prefer fewer rows, larger cards)
      const efficiency = cardSize * (1 + (totalCards - rows) * 0.1) // Bonus for fewer rows

      if (efficiency > bestLayout.efficiency) {
        bestLayout = { cols, rows, cardSize, efficiency }
      }
    }

    return {
      cardSize: Math.max(bestLayout.cardSize, 60), // Minimum 60px
      cols: bestLayout.cols,
      rows: bestLayout.rows,
      gridWidth: bestLayout.cols * bestLayout.cardSize + (bestLayout.cols - 1) * 4, // Reduced gap
      gridHeight: bestLayout.rows * bestLayout.cardSize + (bestLayout.rows - 1) * 4, // Reduced gap
    }
  }

  const [cardDimensions, setCardDimensions] = useState(() => calculateCardDimensions())

  useEffect(() => {
    const handleResize = () => {
      setCardDimensions(calculateCardDimensions())
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [config.pairs])

  useEffect(() => {
    initializeGame()
  }, [])

  // Track score changes for animations
  useEffect(() => {
    setPreviousScores(gameState.scores)
  }, [gameState.scores])

  // Trigger particle effects on matches
  useEffect(() => {
    if (gameState.matchedPairs.length > lastMatchedPairs) {
      setShowParticles(true)
      setTimeout(() => setShowParticles(false), 100)
    }
    setLastMatchedPairs(gameState.matchedPairs.length)
  }, [gameState.matchedPairs.length, lastMatchedPairs])

  // Trigger confetti on game completion
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

  const handleBack = () => {
    playButtonClick()
    onBack()
  }

  const handleTogglePause = () => {
    playButtonClick()
    togglePause()
  }

  const handleResetGame = () => {
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
                Salir
              </Button>
              <div className="hidden sm:block">
                <h1 className="text-xs font-bold text-white truncate">{imagePackage.name}</h1>
                <p className="text-white/80 text-xs">
                  {config.pairs} parejas • {config.players.length} jugador{config.players.length > 1 ? "es" : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <div className="flex items-center gap-1 bg-white/10 rounded px-1 sm:px-2 py-1">
                <Clock className="w-3 h-3 text-white" />
                <span className="text-white font-mono text-xs">{formatTime(timeElapsed)}</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 rounded px-1 sm:px-2 py-1">
                <User className="w-3 h-3 text-white" />
                <span className="text-white truncate max-w-12 sm:max-w-16 text-xs">{getCurrentPlayer()}</span>
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
                  <AudioControls />
                </PopoverContent>
              </Popover>
              <Button
                variant="outline"
                onClick={handleTogglePause}
                className="border-white/20 text-white hover:bg-white/10 bg-transparent h-7 w-7 p-0"
              >
                {gameState.gameStatus === "playing" ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </Button>
              <Button
                variant="outline"
                onClick={handleResetGame}
                className="border-white/20 text-white hover:bg-white/10 bg-transparent h-7 w-7 p-0"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        <div className="px-1 sm:px-2 pb-1">
          <div className="bg-white/10 rounded-full h-1.5">
            <AnimatedProgress value={progress} />
          </div>
        </div>

        {config.players.length > 1 && (
          <div className="px-1 sm:px-2 pb-1">
            <div className="flex gap-1 overflow-x-auto">
              {playerDetails.map((player, index) => (
                <div
                  key={player.name}
                  className={`flex items-center gap-1 bg-white/10 rounded px-1 sm:px-2 py-1 min-w-0 ${
                    index === gameState.currentPlayer ? "ring-1 ring-yellow-400" : ""
                  }`}
                >
                  <div
                    className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PLAYER_COLORS[index % PLAYER_COLORS.length] }}
                  />
                  <span className="text-white text-xs truncate max-w-12 sm:max-w-16">{player.name}</span>
                  <span className="text-white font-bold text-xs">{player.matches}</span>
                  {player.streak > 0 && (
                    <StreakIndicator
                      streak={player.streak}
                      isActive={index === gameState.currentPlayer && gameState.gameStatus === "playing"}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center p-1 min-h-0">
        {" "}
        {/* Reduced padding from p-2 to p-1 */}
        <div
          className="grid gap-1" // Reduced gap from gap-2 to gap-1
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
                card.isMatched
              }
              cardSize={cardDimensions.cardSize}
            />
          ))}
        </div>
      </div>

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
            onPlayAgain={resetGame}
            onExit={onBack}
          />
        )}
      </AnimatePresence>

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
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Juego Pausado</h2>

                  <div className="mb-6">
                    <AudioControls showBackgroundMusic={false} />
                  </div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={handleTogglePause}
                      className="bg-green-500 hover:bg-green-600 text-white h-12 px-6 text-base w-full sm:w-auto"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Continuar
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ParticleEffect trigger={showParticles} />
      <ConfettiExplosion trigger={showConfetti} />
    </div>
  )
}
