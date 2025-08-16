"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { Player, GameRoom, WebSocketMessage } from "@/types/multiplayer"

interface WebSocketContextType {
  socket: WebSocket | null
  isConnected: boolean
  connectionError: string | null
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
  isWebSocketAvailable: boolean
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
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [isWebSocketAvailable, setIsWebSocketAvailable] = useState(true)

  const generateId = () => Math.random().toString(36).substring(2, 15)
  const MAX_RECONNECT_ATTEMPTS = 3

  const connect = useCallback(
    (targetRoomId?: string) => {
      if (!isWebSocketAvailable || socket?.readyState === WebSocket.OPEN) {
        return
      }

      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log("[v0] Max reconnection attempts reached, disabling WebSocket")
        setIsWebSocketAvailable(false)
        setConnectionError("WebSocket server is not available. Multiplayer features are disabled.")
        return
      }

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080"
      console.log("[v0] Attempting to connect to WebSocket:", wsUrl)

      try {
        const newSocket = new WebSocket(wsUrl)

        newSocket.onopen = () => {
          console.log("[v0] WebSocket connected successfully")
          setIsConnected(true)
          setConnectionError(null)
          setReconnectAttempts(0)

          if (targetRoomId && isHost) {
            console.log("[v0] Sending create_room message for room:", targetRoomId)
            setTimeout(() => {
              newSocket.send(
                JSON.stringify({
                  type: "create_room",
                  payload: { roomId: targetRoomId, playerId },
                  roomId: targetRoomId,
                }),
              )
            }, 100)
          } else if (targetRoomId) {
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

        newSocket.onclose = (event) => {
          console.log("[v0] WebSocket disconnected:", event.code, event.reason)
          setIsConnected(false)
          setSocket(null)

          if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            setReconnectAttempts((prev) => prev + 1)
            setTimeout(
              () => {
                console.log(`[v0] Attempting reconnection ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}`)
                connect(targetRoomId)
              },
              2000 * (reconnectAttempts + 1),
            )
          }
        }

        newSocket.onerror = (error) => {
          console.error("[v0] WebSocket connection error")
          setConnectionError("Failed to connect to multiplayer server")
          setReconnectAttempts((prev) => prev + 1)

          if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS - 1) {
            setIsWebSocketAvailable(false)
            setConnectionError("Multiplayer server is not available. Please try again later.")
          }
        }

        setSocket(newSocket)
      } catch (error) {
        console.error("[v0] Error creating WebSocket:", error)
        setConnectionError("Failed to create WebSocket connection")
        setIsWebSocketAvailable(false)
      }
    },
    [socket, reconnectAttempts, isWebSocketAvailable, isHost, playerId],
  )

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close(1000, "User disconnected")
      setSocket(null)
      setIsConnected(false)
      setRoomId(null)
      setPlayerId(null)
      setIsHost(false)
      setPlayers([])
      setGameRoom(null)
      setConnectionError(null)
    }
  }, [socket])

  const sendMessage = useCallback(
    (message: WebSocketMessage) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message))
      } else {
        console.warn("[v0] Cannot send message: WebSocket not connected")
        setConnectionError("Connection lost. Please reconnect.")
      }
    },
    [socket],
  )

  const handleMessage = (message: WebSocketMessage) => {
    console.log("[v0] Received message:", message)

    switch (message.type) {
      case "room_created":
        console.log("[v0] Room created successfully:", message.payload)
        setRoomId(message.payload.roomId)
        setPlayers(message.payload.players || [])
        setGameRoom(message.payload.room)
        break

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
        setConnectionError(message.payload.message || "An error occurred")
        break
    }
  }

  const createRoom = useCallback(() => {
    if (!isWebSocketAvailable) {
      setConnectionError("Multiplayer is not available. WebSocket server is not running.")
      return ""
    }

    const newRoomId = generateId()
    const newPlayerId = generateId()

    console.log("[v0] Creating room with ID:", newRoomId, "Player ID:", newPlayerId)

    setRoomId(newRoomId)
    setPlayerId(newPlayerId)
    setIsHost(true)

    connect(newRoomId)

    return newRoomId
  }, [isWebSocketAvailable, connect])

  const joinRoom = useCallback(
    (targetRoomId: string, playerName: string) => {
      if (!isWebSocketAvailable) {
        setConnectionError("Cannot join room. Multiplayer server is not available.")
        return
      }

      const newPlayerId = generateId()

      setRoomId(targetRoomId)
      setPlayerId(newPlayerId)
      setIsHost(false)

      connect(targetRoomId)

      setTimeout(() => {
        sendMessage({
          type: "join_room",
          payload: { playerName, playerId: newPlayerId },
          roomId: targetRoomId,
        })
      }, 1000)
    },
    [sendMessage, connect, isWebSocketAvailable],
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
    connectionError,
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
    isWebSocketAvailable,
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}
