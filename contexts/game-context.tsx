"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { GameConfig, GameState, ImagePackage } from "@/types/game"

interface GameContextType {
  gameConfig: GameConfig | null
  gameState: GameState | null
  currentPackage: ImagePackage | null
  setGameConfig: (config: GameConfig) => void
  setGameState: (state: GameState) => void
  setCurrentPackage: (pkg: ImagePackage) => void
  resetGame: () => void
  isGameActive: boolean
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [currentPackage, setCurrentPackage] = useState<ImagePackage | null>(null)

  const resetGame = () => {
    setGameConfig(null)
    setGameState(null)
    setCurrentPackage(null)
  }

  const isGameActive = gameState?.gameStatus === "playing"

  return (
    <GameContext.Provider
      value={{
        gameConfig,
        gameState,
        currentPackage,
        setGameConfig,
        setGameState,
        setCurrentPackage,
        resetGame,
        isGameActive,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}
