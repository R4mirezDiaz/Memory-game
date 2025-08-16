"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { Player, GameRoom, WebSocketMessage } from "@/types/multiplayer"

interface WebSocketContextType {
  socket: WebSocket | null
  isConnected: boolean
  roomId: string | null
  playerId: string | null
  isHost: boolean
  players: Player[]
  gameRoom: GameRoom | null
  connect: (roomId?: string) => void
  disconnect: () => void
  sendMessage: (message: WebSocketMessage) => void
  createRoom: () => string
  joinRoom: (roomId: string, playerName: string) => void
  startGame: (gameConfig: any, imagePackage: any) => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider")
  }
  return context
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null)

  const generateId = () => Math.random().toString(36).substring(2, 15)

  const connect = useCallback(
    (targetRoomId?: string) => {
      if (socket?.readyState === WebSocket.OPEN) {
        return
      }

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080"
      const newSocket = new WebSocket(wsUrl)

      newSocket.onopen = () => {
        console.log("[v0] WebSocket connected")
        setIsConnected(true)

        if (targetRoomId) {
          setRoomId(targetRoomId)
        }
      }

      newSocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleMessage(message)
        } catch (error) {
          console.error("[v0] Error parsing WebSocket message:", error)
        }
      }

      newSocket.onclose = () => {
        console.log("[v0] WebSocket disconnected")
        setIsConnected(false)
        setSocket(null)
      }

      newSocket.onerror = (error) => {
        console.error("[v0] WebSocket error:", error)
      }

      setSocket(newSocket)
    },
    [socket],
  )

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close()
      setSocket(null)
      setIsConnected(false)
      setRoomId(null)
      setPlayerId(null)
      setIsHost(false)
      setPlayers([])
      setGameRoom(null)
    }
  }, [socket])

  const sendMessage = useCallback(
    (message: WebSocketMessage) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message))
      }
    },
    [socket],
  )

  const handleMessage = (message: WebSocketMessage) => {
    console.log("[v0] Received message:", message)

    switch (message.type) {
      case "player_joined":
        setPlayers(message.payload.players)
        setGameRoom(message.payload.room)
        break

      case "player_left":
        setPlayers(message.payload.players)
        break

      case "game_start":
        setGameRoom(message.payload.room)
        break

      case "game_state":
        // Game state updates are handled by the multiplayer hook
        break

      case "card_flip":
        // Card flip events are handled by the multiplayer hook
        break

      case "turn_change":
        if (gameRoom) {
          setGameRoom({ ...gameRoom, currentTurn: message.payload.currentTurn })
        }
        break

      case "game_end":
        if (gameRoom) {
          setGameRoom({ ...gameRoom, gameState: "finished" })
        }
        break

      case "error":
        console.error("[v0] WebSocket error:", message.payload)
        break
    }
  }

  const createRoom = useCallback(() => {
    const newRoomId = generateId()
    const newPlayerId = generateId()

    setRoomId(newRoomId)
    setPlayerId(newPlayerId)
    setIsHost(true)

    return newRoomId
  }, [])

  const joinRoom = useCallback(
    (targetRoomId: string, playerName: string) => {
      const newPlayerId = generateId()

      setRoomId(targetRoomId)
      setPlayerId(newPlayerId)
      setIsHost(false)

      sendMessage({
        type: "join_room",
        payload: { playerName, playerId: newPlayerId },
        roomId: targetRoomId,
      })
    },
    [sendMessage],
  )

  const startGame = useCallback(
    (gameConfig: any, imagePackage: any) => {
      if (!isHost || !roomId) return

      sendMessage({
        type: "game_start",
        payload: { gameConfig, imagePackage },
        roomId,
      })
    },
    [isHost, roomId, sendMessage],
  )

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  const value: WebSocketContextType = {
    socket,
    isConnected,
    roomId,
    playerId,
    isHost,
    players,
    gameRoom,
    connect,
    disconnect,
    sendMessage,
    createRoom,
    joinRoom,
    startGame,
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}
