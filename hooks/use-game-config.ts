"use client"

import { useState, useCallback } from "react"
import type { GameConfig, ImagePackage } from "@/types/game"

export interface GameConfigOptions {
  pairs: number
  players: string[]
  timeLimit?: number
  showTimer: boolean
  shuffleCards: boolean
  allowHints: boolean
  soundEnabled: boolean
  difficulty: "easy" | "medium" | "hard"
}

export function useGameConfig(selectedPackage: ImagePackage) {
  const [config, setConfig] = useState<GameConfigOptions>({
    pairs: Math.min(6, selectedPackage.images.length),
    players: ["Jugador 1"],
    timeLimit: undefined,
    showTimer: false,
    shuffleCards: true,
    allowHints: true,
    soundEnabled: true,
    difficulty: "medium",
  })

  const maxPairs = Math.floor(selectedPackage.images.length)
  const minPairs = 2

  const updateConfig = useCallback((updates: Partial<GameConfigOptions>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates }

      // Auto-adjust difficulty based on pairs
      if (updates.pairs !== undefined) {
        newConfig.difficulty = updates.pairs <= 4 ? "easy" : updates.pairs <= 8 ? "medium" : "hard"
      }

      return newConfig
    })
  }, [])

  const addPlayer = useCallback(
    (name: string) => {
      if (name.trim() && config.players.length < 4) {
        updateConfig({ players: [...config.players, name.trim()] })
        return true
      }
      return false
    },
    [config.players, updateConfig],
  )

  const removePlayer = useCallback(
    (index: number) => {
      if (config.players.length > 1) {
        updateConfig({
          players: config.players.filter((_, i) => i !== index),
        })
        return true
      }
      return false
    },
    [config.players, updateConfig],
  )

  const validateConfig = useCallback(() => {
    const errors: string[] = []

    if (config.pairs < minPairs) {
      errors.push(`Mínimo ${minPairs} parejas requeridas`)
    }

    if (config.pairs > maxPairs) {
      errors.push(`Máximo ${maxPairs} parejas disponibles`)
    }

    if (config.players.length === 0) {
      errors.push("Al menos un jugador requerido")
    }

    if (config.players.some((name) => !name.trim())) {
      errors.push("Todos los jugadores deben tener nombre")
    }

    if (config.timeLimit && config.timeLimit < 30) {
      errors.push("Tiempo límite mínimo: 30 segundos")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }, [config, minPairs, maxPairs])

  const createGameConfig = useCallback((): GameConfig => {
    return {
      pairs: Math.min(config.pairs, maxPairs),
      players: config.players.filter((name) => name.trim()),
      selectedPackage: selectedPackage.id,
      difficulty: config.difficulty,
    }
  }, [config, selectedPackage.id, maxPairs])

  return {
    config,
    updateConfig,
    addPlayer,
    removePlayer,
    validateConfig,
    createGameConfig,
    maxPairs,
    minPairs,
  }
}
