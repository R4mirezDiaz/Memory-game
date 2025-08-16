"use client"

import { useState, useEffect } from "react"
import { Users, Crown, Wifi, WifiOff, Clock, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useWebSocket } from "@/contexts/websocket-context"
import { useAudio } from "@/hooks/use-audio"

interface GuestWaitingRoomProps {
  onGameStart: () => void
  onLeave: () => void
}

export function GuestWaitingRoom({ onGameStart, onLeave }: GuestWaitingRoomProps) {
  const { playButtonClick } = useAudio()
  const { roomId, players, gameRoom, isConnected, disconnect } = useWebSocket()

  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting")

  useEffect(() => {
    if (isConnected) {
      setConnectionStatus("connected")
    } else {
      setConnectionStatus("disconnected")
    }
  }, [isConnected])

  useEffect(() => {
    if (gameRoom?.gameState === "playing") {
      onGameStart()
    }
  }, [gameRoom?.gameState, onGameStart])

  const handleLeave = () => {
    playButtonClick()
    disconnect()
    onLeave()
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-300"
      case "connecting":
        return "text-yellow-300"
      case "disconnected":
        return "text-red-300"
      default:
        return "text-white/60"
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Conectado"
      case "connecting":
        return "Conectando..."
      case "disconnected":
        return "Desconectado"
      default:
        return "Desconocido"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="space-y-6">
          {/* Connection Status Card */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Modo Invitado
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <Wifi className="w-4 h-4 text-green-300" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-300" />
                  )}
                  <span className={`text-sm ${getConnectionStatusColor()}`}>{getConnectionStatusText()}</span>
                </div>
              </div>
              <CardDescription className="text-white/80">Esperando que el anfitrión inicie el juego...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <p className="text-white font-medium">Sala ID</p>
                  <p className="text-white/60 text-sm font-mono">{roomId}</p>
                </div>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
                  Invitado
                </Badge>
              </div>

              {gameRoom && (
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-white font-medium mb-2">Información del Juego</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-white/80">
                      Paquete: <span className="text-white">{gameRoom.imagePackage?.name || "Cargando..."}</span>
                    </p>
                    <p className="text-white/80">
                      Estado: <span className="text-white capitalize">{gameRoom.gameState}</span>
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleLeave}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Salir de la Sala
              </Button>
            </CardContent>
          </Card>

          {/* Players List Card */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Jugadores en la Sala ({players.length})
              </CardTitle>
              <CardDescription className="text-white/80">
                {players.length === 1 ? "Esperando más jugadores..." : "Listos para jugar"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {players.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-white/40 mx-auto mb-3" />
                    <p className="text-white/60">Cargando jugadores...</p>
                  </div>
                ) : (
                  players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{player.name}</p>
                          <p className="text-white/60 text-xs">{player.isHost ? "Anfitrión" : "Invitado"}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {player.isHost && <Crown className="w-4 h-4 text-yellow-400" />}
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {players.length > 0 && (
                <div className="mt-4 p-3 bg-green-500/20 rounded-lg border border-green-400/30">
                  <p className="text-green-200 text-sm flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    El anfitrión puede iniciar el juego en cualquier momento
                  </p>
                </div>
              )}

              {!isConnected && (
                <div className="mt-4 p-3 bg-red-500/20 rounded-lg border border-red-400/30">
                  <p className="text-red-200 text-sm flex items-center">
                    <WifiOff className="w-4 h-4 mr-2" />
                    Conexión perdida. Intentando reconectar...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
