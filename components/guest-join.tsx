"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Users, ArrowRight, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useWebSocket } from "@/contexts/websocket-context"
import { useAudio } from "@/hooks/use-audio"
import { PLAYER_COLORS } from "@/lib/player-storage"

interface GuestJoinProps {
  roomId: string
  onJoined: () => void
}

export function GuestJoin({ roomId, onJoined }: GuestJoinProps) {
  const { playButtonClick } = useAudio()
  const { gameState, connect, joinRoom, clearError } = useWebSocket()
  const { isConnected, players, error: wsError } = gameState

  const [playerName, setPlayerName] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState("")
  const [connectionAttempts, setConnectionAttempts] = useState(0)

  useEffect(() => {
    if (!isConnected && connectionAttempts < 3) {
      const timer = setTimeout(() => {
        connect()
        setConnectionAttempts((prev) => prev + 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isConnected, connect, connectionAttempts])

  useEffect(() => {
    if (gameState.roomId === roomId && gameState.playerId) {
      console.log('🎮 [GuestJoin] Jugador unido exitosamente, llamando onJoined()')
      setIsJoining(false)
      onJoined()
    }
  }, [gameState.roomId, gameState.playerId, roomId, onJoined])

  useEffect(() => {
    if (wsError) {
      setError(wsError)
      setIsJoining(false)
    }
  }, [wsError])

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError("Por favor ingresa tu nombre")
      return
    }

    if (playerName.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres")
      return
    }

    if (playerName.trim().length > 20) {
      setError("El nombre no puede tener más de 20 caracteres")
      return
    }

    // Check if name is already taken
    const nameExists = players.some((player) => player.name.toLowerCase() === playerName.trim().toLowerCase())

    if (nameExists) {
      setError("Este nombre ya está en uso, elige otro")
      return
    }

    playButtonClick()
    setIsJoining(true)
    setError("")
    clearError()

    try {
      joinRoom(roomId, playerName.trim())

      // Set timeout for join attempt
      setTimeout(() => {
        if (isJoining) {
          setError("Tiempo de espera agotado. Intenta de nuevo.")
          setIsJoining(false)
        }
      }, 10000)
    } catch (error) {
      setError("Error al unirse a la sala")
      setIsJoining(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isJoining && isConnected && playerName.trim()) {
      handleJoinRoom()
    }
  }

  const handleRetryConnection = () => {
    setConnectionAttempts(0)
    connect()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-white text-2xl">Unirse a la Sala</CardTitle>
          <CardDescription className="text-white/80">
            Ingresa tu nombre para unirte al juego multijugador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
            <div className="flex items-center space-x-2">
              {isConnected ? <Wifi className="w-4 h-4 text-green-300" /> : <WifiOff className="w-4 h-4 text-red-300" />}
              <span className={`text-sm ${isConnected ? "text-green-300" : "text-red-300"}`}>
                {isConnected ? "Conectado" : "Desconectado"}
              </span>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white text-xs">
              Sala: {roomId}
            </Badge>
          </div>

          <div className="space-y-2">
            <label htmlFor="playerName" className="text-white text-sm font-medium">
              Tu nombre:
            </label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu nombre aquí..."
              className="bg-white/10 border-white/20 text-white placeholder-white/50"
              maxLength={20}
              disabled={isJoining || !isConnected}
            />
            <p className="text-white/60 text-xs">{playerName.length}/20 caracteres</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-300" />
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            </div>
          )}

          {!isConnected && connectionAttempts >= 3 && (
            <div className="p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
              <p className="text-yellow-200 text-sm mb-2">
                No se pudo conectar a la sala. Verifica tu conexión a internet.
              </p>
              <Button
                onClick={handleRetryConnection}
                variant="outline"
                size="sm"
                className="border-yellow-400/30 text-yellow-200 hover:bg-yellow-500/10 bg-transparent"
              >
                Reintentar
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={handleJoinRoom}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold"
              disabled={isJoining || !isConnected || !playerName.trim()}
            >
              {isJoining ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uniéndose...
                </div>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Unirse al Juego
                </>
              )}
            </Button>

            <div className="text-center space-y-1">
              <p className="text-white/60 text-xs">
                Sala ID: <span className="font-mono font-semibold">{roomId}</span>
              </p>
              {players.length > 0 && (
                <p className="text-white/60 text-xs">
                  {players.length} jugador{players.length !== 1 ? "es" : ""} en la sala
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
