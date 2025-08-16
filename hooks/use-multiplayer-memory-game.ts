"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import type { Card, GameState, GameConfig, ImagePackage } from "@/types/game"
import { StorageManager } from "@/lib/storage"
import { ScoringSystem } from "@/lib/scoring"
import { useAudio } from "@/hooks/use-audio"
import { useWebSocket } from "@/contexts/websocket-context"

export function useMultiplayerMemoryGame(config: GameConfig, imagePackage: ImagePackage) {
  const { playCardFlip, playMatchFound, playNoMatch, playGameWin, playStreakBonus, playPerfectMatch } = useAudio()
  const { isHost, sendMessage, roomId, playerId, players } = useWebSocket()

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
  const [isMyTurn, setIsMyTurn] = useState(false)

  const stableConfig = useMemo(() => config, [config])
  const stableImagePackage = useMemo(() => imagePackage, [imagePackage])

  useEffect(() => {
    if (players.length > 0 && gameState.currentPlayer < players.length) {
      const currentPlayerObj = players[gameState.currentPlayer]
      setIsMyTurn(currentPlayerObj?.id === playerId)
    }
  }, [gameState.currentPlayer, players, playerId])

  const initializeGame = useCallback(() => {
    if (!isHost) return // Only host initializes the game

    if (!stableConfig?.players?.length || !stableImagePackage?.images?.length) {
      console.error("Cannot initialize game: invalid config or image package")
      return
    }

    const selectedImages = stableImagePackage.images.slice(0, stableConfig.pairs)
    const cards: Card[] = []

    selectedImages.forEach((image, index) => {
      cards.push({
        id: `${image.id}_1`,
        imageId: image.id,
        imageUrl: StorageManager.getImageUrl(image.url, image.type),
        isFlipped: false,
        isMatched: false,
        position: index * 2,
      })

      cards.push({
        id: `${image.id}_2`,
        imageId: image.id,
        imageUrl: StorageManager.getImageUrl(image.url, image.type),
        isFlipped: false,
        isMatched: false,
        position: index * 2 + 1,
      })
    })

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

    players.forEach((player) => {
      scores[player.name] = 0
      streaks[player.name] = 0
      bonusPoints[player.name] = 0
      timeBonus[player.name] = 0
      perfectMatches[player.name] = 0
      matches[player.name] = 0
    })

    const newGameState = {
      cards: shuffledCards,
      currentPlayer: 0,
      scores,
      flippedCards: [],
      matchedPairs: [],
      gameStatus: "playing" as const,
      moves: 0,
      streaks,
      bonusPoints,
      timeBonus,
      perfectMatches,
    }

    setGameState(newGameState)
    setPlayerMatches(matches)
    setGameStartTime(new Date())
    setLastMatchTime(new Date())
    setTimeElapsed(0)

    sendMessage({
      type: "game_state",
      payload: {
        gameState: newGameState,
        playerMatches: matches,
        gameStartTime: new Date().toISOString(),
      },
      roomId,
    })
  }, [isHost, stableConfig.players, stableConfig.pairs, stableImagePackage.images, players, sendMessage, roomId])

  const flipCard = useCallback(
    (cardId: string) => {
      if (!isMyTurn) return // Only allow flipping on player's turn
      if (gameState.gameStatus !== "playing") return
      if (gameState.flippedCards.length >= 2) return

      const card = gameState.cards.find((c) => c.id === cardId)
      if (!card || card.isFlipped || card.isMatched) return

      sendMessage({
        type: "card_flip",
        payload: {
          cardId,
          playerId,
          playerName: players.find((p) => p.id === playerId)?.name || "Unknown",
        },
        roomId,
      })
    },
    [isMyTurn, gameState.gameStatus, gameState.flippedCards, gameState.cards, sendMessage, roomId, playerId, players],
  )

  useEffect(() => {
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data)

        switch (message.type) {
          case "game_state":
            // Receive game state update from host
            if (!isHost) {
              setGameState(message.payload.gameState)
              setPlayerMatches(message.payload.playerMatches)
              if (message.payload.gameStartTime) {
                setGameStartTime(new Date(message.payload.gameStartTime))
              }
            }
            break

          case "card_flip":
            // Handle card flip from any player
            handleCardFlip(message.payload.cardId, message.payload.playerName)
            break

          case "turn_change":
            // Handle turn change
            setGameState((prev) => ({
              ...prev,
              currentPlayer: message.payload.currentPlayer,
            }))
            break

          case "game_end":
            // Handle game end
            setGameState((prev) => ({
              ...prev,
              gameStatus: "finished",
            }))
            setTimeout(() => playGameWin(), 500)
            break
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error)
      }
    }

    // This is a simplified approach - in a real implementation,
    // you'd want to use the WebSocket context's message handling
    return () => {}
  }, [isHost, playGameWin])

  const handleCardFlip = useCallback(
    (cardId: string, playerName: string) => {
      playCardFlip()

      setGameState((prev) => {
        if (prev.gameStatus !== "playing") return prev
        if (prev.flippedCards.length >= 2) return prev

        const card = prev.cards.find((c) => c.id === cardId)
        if (!card || card.isFlipped || card.isMatched) return prev

        const newFlippedCards = [...prev.flippedCards, cardId]
        const newCards = prev.cards.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c))

        const newState = {
          ...prev,
          cards: newCards,
          flippedCards: newFlippedCards,
          moves: prev.moves + 1,
        }

        if (isHost && newFlippedCards.length === 2) {
          setTimeout(() => {
            processMatch(newFlippedCards, playerName)
          }, 1000)
        }

        return newState
      })
    },
    [playCardFlip, isHost],
  )

  const processMatch = useCallback(
    (flippedCards: string[], playerName: string) => {
      if (!isHost) return

      const [firstCardId, secondCardId] = flippedCards
      const firstCard = gameState.cards.find((c) => c.id === firstCardId)
      const secondCard = gameState.cards.find((c) => c.id === secondCardId)

      if (!firstCard || !secondCard) return

      const isMatch = firstCard.imageId === secondCard.imageId

      setGameState((prev) => {
        let newCurrentPlayer = prev.currentPlayer
        const newScores = { ...prev.scores }
        const newStreaks = { ...prev.streaks }
        const newBonusPoints = { ...prev.bonusPoints }
        const newTimeBonus = { ...prev.timeBonus }
        const newPerfectMatches = { ...prev.perfectMatches }
        const newMatchedPairs = [...prev.matchedPairs]

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
          playMatchFound()
          newStreaks[playerName] = (newStreaks[playerName] || 0) + 1
          newMatchedPairs.push(firstCard.imageId)

          setPlayerMatches((prevMatches) => {
            const newMatches = { ...prevMatches }
            newMatches[playerName] = (newMatches[playerName] || 0) + 1
            newScores[playerName] = newMatches[playerName] * ScoringSystem.POINTS_PER_PAIR
            return newMatches
          })

          if (newStreaks[playerName] >= 3) {
            playStreakBonus(newStreaks[playerName])
          }

          if (prev.moves <= newMatchedPairs.length * 2) {
            newPerfectMatches[playerName] = (newPerfectMatches[playerName] || 0) + 1
            playPerfectMatch()
          }

          setLastMatchTime(new Date())
        } else {
          playNoMatch()
          newStreaks[playerName] = 0
          newCurrentPlayer = (prev.currentPlayer + 1) % players.length
        }

        const allMatched = newCards.every((card) => card.isMatched)
        const newGameStatus = allMatched ? "finished" : "playing"

        const newState = {
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

        sendMessage({
          type: "game_state",
          payload: {
            gameState: newState,
            playerMatches,
          },
          roomId,
        })

        if (newGameStatus === "finished") {
          sendMessage({
            type: "game_end",
            payload: { winner: getWinners() },
            roomId,
          })
        } else if (!isMatch) {
          sendMessage({
            type: "turn_change",
            payload: { currentPlayer: newCurrentPlayer },
            roomId,
          })
        }

        return newState
      })
    },
    [
      isHost,
      gameState.cards,
      players.length,
      playMatchFound,
      playNoMatch,
      playStreakBonus,
      playPerfectMatch,
      sendMessage,
      roomId,
      playerMatches,
    ],
  )

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
    if (!players?.length) return "Jugador 1"
    const currentPlayerObj = players[gameState.currentPlayer]
    return currentPlayerObj?.name || players[0]?.name || "Jugador 1"
  }, [players, gameState.currentPlayer])

  // Get winner(s)
  const getWinners = useCallback(() => {
    if (gameState.gameStatus !== "finished") return []

    const maxScore = Math.max(...Object.values(gameState.scores))
    return Object.entries(gameState.scores)
      .filter(([, score]) => score === maxScore)
      .map(([player]) => player)
  }, [gameState.gameStatus, gameState.scores])

  const getPlayerDetails = useCallback(() => {
    if (!players?.length) return []

    return players.map((player) => ({
      name: player.name,
      score: gameState.scores[player.name] || 0,
      streak: gameState.streaks[player.name] || 0,
      bonusPoints: gameState.bonusPoints[player.name] || 0,
      perfectMatches: gameState.perfectMatches[player.name] || 0,
      matches: playerMatches[player.name] || 0,
      color: player.color,
      isCurrentPlayer: players[gameState.currentPlayer]?.id === player.id,
    }))
  }, [
    players,
    gameState.scores,
    gameState.streaks,
    gameState.bonusPoints,
    gameState.perfectMatches,
    gameState.currentPlayer,
    playerMatches,
  ])

  // Reset game
  const resetGame = useCallback(() => {
    if (isHost) {
      initializeGame()
    }
  }, [isHost, initializeGame])

  // Pause/Resume game
  const togglePause = useCallback(() => {
    if (!isHost) return // Only host can pause

    setGameState((prev) => {
      const newStatus = prev.gameStatus === "playing" ? "setup" : "playing"

      sendMessage({
        type: "game_state",
        payload: {
          gameState: { ...prev, gameStatus: newStatus },
          playerMatches,
        },
        roomId,
      })

      return {
        ...prev,
        gameStatus: newStatus,
      }
    })
  }, [isHost, sendMessage, roomId, playerMatches])

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
    isMyTurn,
    isHost,
  }
}
