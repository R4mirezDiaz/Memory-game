"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import type { Card, GameState, GameConfig, ImagePackage, GameResult } from "@/types/game"
import { StorageManager } from "@/lib/storage"
import { ScoringSystem } from "@/lib/scoring"
import { StatsStorage } from "@/lib/stats-storage"
import { useAudio } from "@/hooks/use-audio"

export function useMemoryGame(config: GameConfig, imagePackage: ImagePackage) {
  const { playCardFlip, playMatchFound, playNoMatch, playGameWin, playStreakBonus, playPerfectMatch } = useAudio()

  if (!config || !config.players || !imagePackage || !imagePackage.images) {
    throw new Error("Invalid game configuration or image package")
  }

  const [gameState, setGameState] = useState<GameState>({
    cards: [],
    currentPlayer: 0,
    scores: {},
    flippedCards: [],
    matchedPairs: [],
    gameStatus: "setup",
    moves: 0,
    streaks: {},
    bonusPoints: {},
    timeBonus: {},
    perfectMatches: {},
  })

  const [timeElapsed, setTimeElapsed] = useState(0)
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null)
  const [lastMatchTime, setLastMatchTime] = useState<Date | null>(null)
  const [playerMatches, setPlayerMatches] = useState<Record<string, number>>({})

  const stableConfig = useMemo(() => config, [config])
  const stableImagePackage = useMemo(() => imagePackage, [imagePackage])

  // Initialize game
  const initializeGame = useCallback(() => {
    if (!stableConfig?.players?.length || !stableImagePackage?.images?.length) {
      console.error("Cannot initialize game: invalid config or image package")
      return
    }

    const selectedImages = stableImagePackage.images.slice(0, stableConfig.pairs)
    const cards: Card[] = []

    // Create pairs of cards
    selectedImages.forEach((image, index) => {
      // First card of the pair
      cards.push({
        id: `${image.id}_1`,
        imageId: image.id,
        imageUrl: StorageManager.getImageUrl(image.url, image.type),
        isFlipped: false,
        isMatched: false,
        position: index * 2,
      })

      // Second card of the pair
      cards.push({
        id: `${image.id}_2`,
        imageId: image.id,
        imageUrl: StorageManager.getImageUrl(image.url, image.type),
        isFlipped: false,
        isMatched: false,
        position: index * 2 + 1,
      })
    })

    // Shuffle cards
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5)
    shuffledCards.forEach((card, index) => {
      card.position = index
    })

    const scores: Record<string, number> = {}
    const streaks: Record<string, number> = {}
    const bonusPoints: Record<string, number> = {}
    const timeBonus: Record<string, number> = {}
    const perfectMatches: Record<string, number> = {}
    const matches: Record<string, number> = {}

    stableConfig.players.forEach((player) => {
      scores[player] = 0
      streaks[player] = 0
      bonusPoints[player] = 0
      timeBonus[player] = 0
      perfectMatches[player] = 0
      matches[player] = 0
    })

    setGameState({
      cards: shuffledCards,
      currentPlayer: 0,
      scores,
      flippedCards: [],
      matchedPairs: [],
      gameStatus: "playing",
      moves: 0,
      streaks,
      bonusPoints,
      timeBonus,
      perfectMatches,
    })

    setPlayerMatches(matches)
    setGameStartTime(new Date())
    setLastMatchTime(new Date())
    setTimeElapsed(0)
  }, [stableConfig.players, stableConfig.pairs, stableImagePackage.images])

  // Flip a card
  const flipCard = useCallback(
    (cardId: string) => {
      setGameState((prev) => {
        if (prev.gameStatus !== "playing") return prev
        if (prev.flippedCards.length >= 2) return prev

        const card = prev.cards.find((c) => c.id === cardId)
        if (!card || card.isFlipped || card.isMatched) return prev

        // Play card flip sound
        playCardFlip()

        const newFlippedCards = [...prev.flippedCards, cardId]
        const newCards = prev.cards.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c))

        return {
          ...prev,
          cards: newCards,
          flippedCards: newFlippedCards,
          moves: prev.moves + 1,
        }
      })
    },
    [playCardFlip],
  )

  // Check for matches - only depend on flippedCards length and specific values
  useEffect(() => {
    if (gameState.flippedCards.length === 2) {
      const [firstCardId, secondCardId] = gameState.flippedCards
      const firstCard = gameState.cards.find((c) => c.id === firstCardId)
      const secondCard = gameState.cards.find((c) => c.id === secondCardId)

      if (firstCard && secondCard) {
        const isMatch = firstCard.imageId === secondCard.imageId

        setTimeout(() => {
          setGameState((prev) => {
            let newCurrentPlayer = prev.currentPlayer
            const newScores = { ...prev.scores }
            const newStreaks = { ...prev.streaks }
            const newBonusPoints = { ...prev.bonusPoints }
            const newTimeBonus = { ...prev.timeBonus }
            const newPerfectMatches = { ...prev.perfectMatches }
            const newMatchedPairs = [...prev.matchedPairs]

            const currentPlayerName = stableConfig.players[prev.currentPlayer]

            const newCards = prev.cards.map((card) => {
              if (card.id === firstCardId || card.id === secondCardId) {
                if (isMatch) {
                  return { ...card, isMatched: true, isFlipped: true }
                } else {
                  return { ...card, isFlipped: false }
                }
              }
              return card
            })

            if (isMatch) {
              // Play match sound effects
              playMatchFound()

              newStreaks[currentPlayerName] = (newStreaks[currentPlayerName] || 0) + 1
              newMatchedPairs.push(firstCard.imageId)

              setPlayerMatches((prevMatches) => {
                const newMatches = { ...prevMatches }
                newMatches[currentPlayerName] = (newMatches[currentPlayerName] || 0) + 1

                newScores[currentPlayerName] = newMatches[currentPlayerName] * ScoringSystem.POINTS_PER_PAIR

                return newMatches
              })

              // Play streak bonus sound for streaks >= 3
              if (newStreaks[currentPlayerName] >= 3) {
                playStreakBonus(newStreaks[currentPlayerName])
              }

              // Perfect match bonus (first try)
              if (prev.moves <= newMatchedPairs.length * 2) {
                newPerfectMatches[currentPlayerName] = (newPerfectMatches[currentPlayerName] || 0) + 1
                // Play perfect match sound
                playPerfectMatch()
              }

              setLastMatchTime(new Date())
            } else {
              // Play no match sound
              playNoMatch()

              // Reset streak on miss
              newStreaks[currentPlayerName] = 0
              // Switch to next player
              newCurrentPlayer = (prev.currentPlayer + 1) % stableConfig.players.length
            }

            // Check if game is finished
            const allMatched = newCards.every((card) => card.isMatched)
            const newGameStatus = allMatched ? "finished" : "playing"

            // Play game win sound when finished
            if (newGameStatus === "finished") {
              setTimeout(() => playGameWin(), 500)

              const gameResult: GameResult = {
                id: `game_${Date.now()}`,
                packageName: stableImagePackage.name,
                packageId: stableImagePackage.id,
                players: stableConfig.players.map((playerName) => ({
                  name: playerName,
                  score: newScores[playerName] || 0,
                  matches: playerMatches[playerName] || 0,
                  bonusPoints: newBonusPoints[playerName] || 0,
                  timeBonus: newTimeBonus[playerName] || 0,
                  streak: newStreaks[playerName] || 0,
                  perfectMatches: newPerfectMatches[playerName] || 0,
                  rank: 0,
                })),
                totalTime: timeElapsed,
                totalMoves: prev.moves,
                difficulty: stableConfig.difficulty,
                pairs: stableConfig.pairs,
                completedAt: new Date(),
              }

              // Calculate ranks
              gameResult.players.sort((a, b) => b.score - a.score)
              gameResult.players.forEach((player, index) => {
                player.rank = index + 1
              })

              StatsStorage.saveGameResult(gameResult)
            }

            return {
              ...prev,
              cards: newCards,
              currentPlayer: newCurrentPlayer,
              scores: newScores,
              streaks: newStreaks,
              bonusPoints: newBonusPoints,
              timeBonus: newTimeBonus,
              perfectMatches: newPerfectMatches,
              matchedPairs: newMatchedPairs,
              flippedCards: [],
              gameStatus: newGameStatus,
            }
          })
        }, 1000)
      }
    }
  }, [gameState.flippedCards.length, gameState.flippedCards[0], gameState.flippedCards[1]])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (gameState.gameStatus === "playing" && gameStartTime) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - gameStartTime.getTime()) / 1000))
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameState.gameStatus, gameStartTime])

  // Get current player
  const getCurrentPlayer = useCallback(() => {
    if (!stableConfig?.players?.length) return "Jugador 1"
    return stableConfig.players[gameState.currentPlayer] || stableConfig.players[0]
  }, [stableConfig?.players, gameState.currentPlayer])

  // Get winner(s)
  const getWinners = useCallback(() => {
    if (gameState.gameStatus !== "finished") return []

    const maxScore = Math.max(...Object.values(gameState.scores))
    return Object.entries(gameState.scores)
      .filter(([, score]) => score === maxScore)
      .map(([player]) => player)
  }, [gameState.gameStatus, gameState.scores])

  const getPlayerDetails = useCallback(() => {
    if (!stableConfig?.players?.length) return []

    return stableConfig.players.map((player) => ({
      name: player,
      score: gameState.scores[player] || 0,
      streak: gameState.streaks[player] || 0,
      bonusPoints: gameState.bonusPoints[player] || 0,
      perfectMatches: gameState.perfectMatches[player] || 0,
      matches: playerMatches[player] || 0, // Added matches count
    }))
  }, [
    stableConfig?.players,
    gameState.scores,
    gameState.streaks,
    gameState.bonusPoints,
    gameState.perfectMatches,
    playerMatches,
  ])

  // Reset game
  const resetGame = useCallback(() => {
    initializeGame()
  }, [initializeGame])

  // Pause/Resume game
  const togglePause = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      gameStatus: prev.gameStatus === "playing" ? "setup" : "playing",
    }))
  }, [])

  return {
    gameState,
    timeElapsed,
    flipCard,
    initializeGame,
    getCurrentPlayer,
    getWinners,
    getPlayerDetails,
    resetGame,
    togglePause,
  }
}
