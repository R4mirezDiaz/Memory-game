"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Users, Grid3X3, Play, Settings, Clock, Volume2, Shuffle, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { ImagePackage } from "@/types/game"
import { useGameConfig } from "@/hooks/use-game-config"
import { useGame } from "@/contexts/game-context"
import { getSavedPlayers, savePlayer, deletePlayer, PLAYER_COLORS, type SavedPlayer } from "@/lib/player-storage"

interface Player {
  name: string
  color: string
}

interface GameSetupProps {
  selectedPackage: ImagePackage
  onBack: () => void
  onStartGame: () => void
}

export function GameSetup({ selectedPackage, onBack, onStartGame }: GameSetupProps) {
  const [players, setPlayers] = useState<Player[]>([{ name: "Jugador 1", color: PLAYER_COLORS[0] }])
  const [savedPlayers, setSavedPlayers] = useState<SavedPlayer[]>([])
  const [showSavedPlayers, setShowSavedPlayers] = useState(false)
  const { setGameConfig, setCurrentPackage } = useGame()

  const { config, updateConfig, validateConfig, createGameConfig, maxPairs, minPairs } = useGameConfig(selectedPackage)

  useEffect(() => {
    setSavedPlayers(getSavedPlayers())
  }, [])

  useEffect(() => {
    updateConfig({ players: players.map((p) => p.name) })
  }, [players, updateConfig])

  const validation = validateConfig()

  const addPlayer = () => {
    if (players.length < 4) {
      const newPlayer: Player = {
        name: `Jugador ${players.length + 1}`,
        color: PLAYER_COLORS[players.length % PLAYER_COLORS.length],
      }
      setPlayers([...players, newPlayer])
    }
  }

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index))
    }
  }

  const updatePlayer = (index: number, updates: Partial<Player>) => {
    setPlayers(players.map((player, i) => (i === index ? { ...player, ...updates } : player)))
  }

  const addSavedPlayer = (savedPlayer: SavedPlayer) => {
    if (players.length < 4) {
      const newPlayer: Player = {
        name: savedPlayer.name,
        color: savedPlayer.color,
      }
      setPlayers([...players, newPlayer])
    }
  }

  const handleStartGame = () => {
    if (validation.isValid) {
      // Save all players
      players.forEach((player) => {
        savePlayer({
          name: player.name,
          color: player.color,
          gamesPlayed: 0,
          totalWins: 0,
          bestTime: null,
        })
      })

      const gameConfig = createGameConfig()
      setGameConfig(gameConfig)
      setCurrentPackage(selectedPackage)
      onStartGame()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-white/20 text-white hover:bg-white/10 bg-transparent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-white">Configurar Partida</h2>
          <p className="text-white/80">Paquete: {selectedPackage.name}</p>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/10">
          <TabsTrigger value="basic" className="text-white data-[state=active]:bg-white/20">
            Configuración Básica
          </TabsTrigger>
          <TabsTrigger value="advanced" className="text-white data-[state=active]:bg-white/20">
            Opciones Avanzadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Jugadores
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSavedPlayers(!showSavedPlayers)}
                    className="ml-auto border-white/20 text-white hover:bg-white/10 bg-transparent text-xs"
                  >
                    {showSavedPlayers ? "Ocultar" : "Guardados"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {players.map((player, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white/30 flex-shrink-0"
                        style={{ backgroundColor: player.color }}
                      />
                      <Input
                        value={player.name}
                        onChange={(e) => updatePlayer(index, { name: e.target.value })}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 flex-1"
                        placeholder="Nombre del jugador"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 text-white hover:bg-white/10 bg-transparent w-8 h-8 p-0"
                          >
                            🎨
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 bg-white/10 backdrop-blur-sm border-white/20">
                          <div className="grid grid-cols-4 gap-2">
                            {PLAYER_COLORS.map((color) => (
                              <button
                                key={color}
                                className={`w-8 h-8 rounded-full border-2 ${
                                  player.color === color ? "border-white" : "border-white/30"
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => updatePlayer(index, { color })}
                              />
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      {players.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePlayer(index)}
                          className="border-red-300/20 text-red-300 hover:bg-red-500/10 w-8 h-8 p-0"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                {players.length < 4 && (
                  <Button
                    onClick={addPlayer}
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
                  >
                    + Agregar Jugador
                  </Button>
                )}

                {showSavedPlayers && savedPlayers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-white text-sm font-medium">Jugadores Guardados:</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {savedPlayers.map((savedPlayer) => (
                        <div key={savedPlayer.name} className="flex items-center gap-2 p-2 bg-white/5 rounded text-xs">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: savedPlayer.color }} />
                          <span className="text-white flex-1">{savedPlayer.name}</span>
                          <span className="text-white/60">{savedPlayer.gamesPlayed} juegos</span>
                          <Button
                            size="sm"
                            onClick={() => addSavedPlayer(savedPlayer)}
                            disabled={players.length >= 4}
                            className="h-6 px-2 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300"
                          >
                            +
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              deletePlayer(savedPlayer.name)
                              setSavedPlayers(getSavedPlayers())
                            }}
                            className="h-6 px-2 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300"
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-white/70 text-sm">Máximo 4 jugadores. Juego por turnos.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5" />
                  Dificultad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pairs" className="text-white">
                    Número de parejas: {config.pairs}
                  </Label>
                  <input
                    id="pairs"
                    type="range"
                    min={minPairs}
                    max={maxPairs}
                    value={config.pairs}
                    onChange={(e) => updateConfig({ pairs: Number.parseInt(e.target.value) })}
                    className="w-full mt-2"
                  />
                  <div className="flex justify-between text-sm text-white/70 mt-1">
                    <span>Fácil ({minPairs})</span>
                    <span>Difícil ({maxPairs})</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/80">Cartas totales:</span>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {config.pairs * 2}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Dificultad:</span>
                    <Badge
                      variant="secondary"
                      className={`${
                        config.difficulty === "easy"
                          ? "bg-green-500/20 text-green-300"
                          : config.difficulty === "medium"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {config.difficulty === "easy" ? "Fácil" : config.difficulty === "medium" ? "Medio" : "Difícil"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/80">Imágenes disponibles:</span>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {selectedPackage.images.length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Tiempo y Cronómetro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-timer" className="text-white">
                    Mostrar cronómetro
                  </Label>
                  <Switch
                    id="show-timer"
                    checked={config.showTimer}
                    onCheckedChange={(checked) => updateConfig({ showTimer: checked })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-limit" className="text-white">
                    Tiempo límite (opcional)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="time-limit"
                      type="number"
                      min="30"
                      max="600"
                      value={config.timeLimit || ""}
                      onChange={(e) =>
                        updateConfig({
                          timeLimit: e.target.value ? Number.parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Segundos"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                    <Button
                      variant="outline"
                      onClick={() => updateConfig({ timeLimit: undefined })}
                      className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                    >
                      Sin límite
                    </Button>
                  </div>
                  <p className="text-white/70 text-sm">Tiempo total para completar el juego</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Opciones de Juego
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-white" />
                    <Label htmlFor="sound" className="text-white">
                      Efectos de sonido
                    </Label>
                  </div>
                  <Switch
                    id="sound"
                    checked={config.soundEnabled}
                    onCheckedChange={(checked) => updateConfig({ soundEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shuffle className="w-4 h-4 text-white" />
                    <Label htmlFor="shuffle" className="text-white">
                      Mezclar cartas
                    </Label>
                  </div>
                  <Switch
                    id="shuffle"
                    checked={config.shuffleCards}
                    onCheckedChange={(checked) => updateConfig({ shuffleCards: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-white" />
                    <Label htmlFor="hints" className="text-white">
                      Permitir pistas
                    </Label>
                  </div>
                  <Switch
                    id="hints"
                    checked={config.allowHints}
                    onCheckedChange={(checked) => updateConfig({ allowHints: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {!validation.isValid && (
        <Alert className="bg-red-500/10 border-red-500/20">
          <AlertDescription className="text-red-300">
            <ul className="list-disc list-inside space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Button
              onClick={handleStartGame}
              size="lg"
              disabled={!validation.isValid}
              className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5 mr-2" />
              ¡Comenzar Partida!
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
