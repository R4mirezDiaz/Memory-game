"use client"

import { useState, useEffect } from "react"
import { Users, Crown, Copy, Check, Play, ArrowLeft, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useWebSocket } from "@/contexts/websocket-context"
import { useAudio } from "@/hooks/use-audio"
import { QRCodeGenerator } from "./qr-code-generator"
import type { ImagePackage } from "@/types/game"

interface RoomLobbyProps {
  selectedPackage: ImagePackage
  onStartGame: () => void
  onBack: () => void
}

export function RoomLobby({ selectedPackage, onStartGame, onBack }: RoomLobbyProps) {
  const { playButtonClick } = useAudio()
  const { roomId, isHost, players, gameRoom, isConnected, connect, createRoom, startGame } = useWebSocket()

  const [copied, setCopied] = useState(false)
  const [roomUrl, setRoomUrl] = useState("")
  const [showQR, setShowQR] = useState(false)

  useEffect(() => {
    if (isHost && roomId) {
      const baseUrl = window.location.origin
      const url = `${baseUrl}?room=${roomId}`
      setRoomUrl(url)
    }
  }, [isHost, roomId])

  useEffect(() => {
    if (!isConnected && !roomId) {
      console.log("[v0] Connecting to WebSocket from RoomLobby")
      connect()
    }
  }, [isConnected, connect, roomId])

  const handleCreateRoom = () => {
    playButtonClick()
    console.log("[v0] Creating new room...")
    createRoom()
  }

  const handleCopyRoomUrl = async () => {
    playButtonClick()
    try {
      await navigator.clipboard.writeText(roomUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy room URL:", error)
    }
  }

  const handleToggleQR = () => {
    playButtonClick()
    setShowQR(!showQR)
  }

  const handleStartGame = () => {
    playButtonClick()
    if (isHost && players.length >= 1) {
      startGame({}, selectedPackage)
      onStartGame()
    }
  }

  const handleBack = () => {
    playButtonClick()
    onBack()
  }

  if (!roomId && isHost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-2xl">Crear Sala Multijugador</CardTitle>
            <CardDescription className="text-white/80">Crea una sala para jugar con otros dispositivos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge variant="secondary" className="bg-white/20 text-white mb-4">
                Paquete: {selectedPackage.name}
              </Badge>
            </div>

            {!isConnected && (
              <div className="text-center p-2 bg-yellow-500/20 rounded border border-yellow-400/30">
                <p className="text-yellow-200 text-sm">Conectando al servidor...</p>
              </div>
            )}

            <Button
              onClick={handleCreateRoom}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold"
              disabled={!isConnected}
            >
              <Users className="w-4 h-4 mr-2" />
              {isConnected ? "Crear Sala" : "Conectando..."}
            </Button>

            <Button
              onClick={handleBack}
              variant="outline"
              className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className={`grid gap-6 ${showQR ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-2"}`}>
          {/* Room Info Card */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  {isHost && <Crown className="w-5 h-5 mr-2 text-yellow-400" />}
                  Sala de Juego
                </CardTitle>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  ID: {roomId}
                </Badge>
              </div>
              <CardDescription className="text-white/80">Paquete: {selectedPackage.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isHost && (
                <div className="space-y-2">
                  <label className="text-white text-sm font-medium">Enlace para invitar jugadores:</label>
                  <div className="flex gap-2">
                    <Input
                      value={roomUrl}
                      readOnly
                      className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    />
                    <Button
                      onClick={handleCopyRoomUrl}
                      variant="outline"
                      size="icon"
                      className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleToggleQR}
                      variant="outline"
                      className="flex-1 border-white/20 text-white hover:bg-white/10 bg-transparent"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      {showQR ? "Ocultar QR" : "Mostrar QR"}
                    </Button>
                  </div>
                  <p className="text-white/60 text-xs">Comparte este enlace o genera un QR para que otros se unan</p>
                </div>
              )}

              <div className="flex gap-2">
                {isHost && (
                  <Button
                    onClick={handleStartGame}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold"
                    disabled={players.length < 1}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Juego
                  </Button>
                )}

                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Salir
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Players List Card */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Jugadores ({players.length})
              </CardTitle>
              <CardDescription className="text-white/80">
                {isHost ? "Esperando que se unan más jugadores..." : "Esperando que el host inicie el juego..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {players.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-white/40 mx-auto mb-3" />
                    <p className="text-white/60">No hay jugadores conectados</p>
                  </div>
                ) : (
                  players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: player.color }}
                        >
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium">{player.name}</p>
                          <p className="text-white/60 text-xs">{player.isHost ? "Anfitrión" : "Invitado"}</p>
                        </div>
                      </div>
                      {player.isHost && <Crown className="w-4 h-4 text-yellow-400" />}
                    </div>
                  ))
                )}
              </div>

              {isHost && players.length < 4 && (
                <div className="mt-4 p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
                  <p className="text-blue-200 text-sm">
                    💡 Tip: Puedes jugar con hasta 4 jugadores. Comparte el enlace para que más personas se unan.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {showQR && isHost && roomUrl && (
            <QRCodeGenerator url={roomUrl} roomId={roomId || ""} onClose={() => setShowQR(false)} />
          )}
        </div>
      </div>
    </div>
  )
}
