"use client"

import { useState, useEffect } from "react"
import { Plus, Package, Edit, Trash2, ImageIcon, Download, Upload, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ImagePackage } from "@/types/game"
import { StorageManager } from "@/lib/storage"
import { useAudio } from "@/hooks/use-audio"
import { useGame } from "@/contexts/game-context"
import { useWebSocket } from "@/contexts/websocket-context"
import { PackageEditor } from "./package-editor"
import { GameSetup } from "./game-setup"
import { MemoryGame } from "./memory-game"
import { MultiplayerMemoryGame } from "./multiplayer-memory-game"
import { RoomLobby } from "./room-lobby"
import { GuestJoin } from "./guest-join"
import { GuestWaitingRoom } from "./guest-waiting-room"

export function ImagePackageManager() {
  const { playButtonClick } = useAudio()
  const { isConnected, roomId } = useWebSocket()

  const [packages, setPackages] = useState<ImagePackage[]>([])
  const [editingPackage, setEditingPackage] = useState<ImagePackage | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showGameSetup, setShowGameSetup] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<ImagePackage | null>(null)
  const [showGame, setShowGame] = useState(false)
  const [showMultiplayerGame, setShowMultiplayerGame] = useState(false)
  const [showRoomLobby, setShowRoomLobby] = useState(false)
  const [showGuestJoin, setShowGuestJoin] = useState(false)
  const [showGuestWaiting, setShowGuestWaiting] = useState(false)
  const [guestRoomId, setGuestRoomId] = useState<string | null>(null)

  const { gameConfig, currentPackage } = useGame()

  useEffect(() => {
    const loadPackages = async () => {
      const savedPackages = StorageManager.getPackages()
      setPackages(savedPackages)
    }
    loadPackages()

    const urlParams = new URLSearchParams(window.location.search)
    const roomParam = urlParams.get("room")
    if (roomParam) {
      setGuestRoomId(roomParam)
      setShowGuestJoin(true)
    }
  }, [])

  const handlePlayGame = (pkg: ImagePackage) => {
    playButtonClick()
    setSelectedPackage(pkg)
    setShowGameSetup(true)
  }

  const handlePlayMultiplayer = (pkg: ImagePackage) => {
    playButtonClick()

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080"

    // Check if WebSocket server is available
    const testSocket = new WebSocket(wsUrl)

    testSocket.onopen = () => {
      testSocket.close()
      setSelectedPackage(pkg)
      setShowRoomLobby(true)
    }

    testSocket.onerror = () => {
      alert("Servidor multijugador no disponible. Asegúrate de que el servidor WebSocket esté ejecutándose en " + wsUrl)
    }

    // Timeout after 3 seconds
    setTimeout(() => {
      if (testSocket.readyState === WebSocket.CONNECTING) {
        testSocket.close()
        alert("No se pudo conectar al servidor multijugador. Verifica que esté ejecutándose.")
      }
    }, 3000)
  }

  const handleEditPackage = (pkg: ImagePackage) => {
    playButtonClick()
    setEditingPackage(pkg)
    setShowEditor(true)
  }

  const handleDeletePackage = (packageId: string) => {
    playButtonClick()
    const updatedPackages = packages.filter((pkg) => pkg.id !== packageId)
    setPackages(updatedPackages)
    StorageManager.savePackages(updatedPackages)
  }

  const handleNewPackage = () => {
    playButtonClick()
    setEditingPackage(null)
    setShowEditor(true)
  }

  const handleSavePackage = (packageData: ImagePackage) => {
    const updatedPackages = editingPackage
      ? packages.map((pkg) => (pkg.id === packageData.id ? packageData : pkg))
      : [...packages, packageData]

    setPackages(updatedPackages)
    StorageManager.savePackages(updatedPackages)
    setShowEditor(false)
    setEditingPackage(null)
  }

  const handleCancelEdit = () => {
    setShowEditor(false)
    setEditingPackage(null)
  }

  const handleStartGame = () => {
    setShowGameSetup(false)
    setShowRoomLobby(false)

    if (isConnected && roomId) {
      setShowMultiplayerGame(true)
    } else {
      setShowGame(true)
    }
  }

  const handleBackFromSetup = () => {
    setShowGameSetup(false)
    setSelectedPackage(null)
  }

  const handleBackFromRoomLobby = () => {
    setShowRoomLobby(false)
    setSelectedPackage(null)
  }

  const handleBackFromGame = () => {
    setShowGame(false)
    setShowMultiplayerGame(false)
    setSelectedPackage(null)
  }

  const handleExportPackage = (pkg: ImagePackage) => {
    playButtonClick()
    const urlImages = pkg.images.filter((img) => img.url && !img.file)
    if (urlImages.length === 0) {
      alert("Este paquete no contiene imágenes por URL para exportar")
      return
    }

    const exportData = {
      ...pkg,
      images: urlImages,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `${pkg.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_package.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImportPackage = () => {
    playButtonClick()
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string)

          if (!importedData.name || !importedData.images || !Array.isArray(importedData.images)) {
            alert("Archivo JSON inválido")
            return
          }

          const newPackage: ImagePackage = {
            ...importedData,
            id: Date.now().toString(),
            name: `${importedData.name} (Importado)`,
            createdAt: new Date().toISOString(),
          }

          const updatedPackages = [...packages, newPackage]
          setPackages(updatedPackages)
          StorageManager.savePackages(updatedPackages)

          alert(`Paquete "${newPackage.name}" importado exitosamente`)
        } catch (error) {
          alert("Error al importar el archivo JSON")
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleGuestJoined = () => {
    setShowGuestJoin(false)
    setShowGuestWaiting(true)
  }

  const handleGuestGameStart = () => {
    setShowGuestWaiting(false)
    setShowMultiplayerGame(true)
  }

  const handleGuestLeave = () => {
    setShowGuestWaiting(false)
    setGuestRoomId(null)
    // Clear URL parameter
    window.history.replaceState({}, document.title, window.location.pathname)
  }

  if (showGuestJoin && guestRoomId) {
    return <GuestJoin roomId={guestRoomId} onJoined={handleGuestJoined} />
  }

  if (showGuestWaiting) {
    return <GuestWaitingRoom onGameStart={handleGuestGameStart} onLeave={handleGuestLeave} />
  }

  if (showRoomLobby && selectedPackage) {
    return (
      <RoomLobby selectedPackage={selectedPackage} onStartGame={handleStartGame} onBack={handleBackFromRoomLobby} />
    )
  }

  if (showMultiplayerGame && selectedPackage && gameConfig) {
    return (
      <div className="fixed inset-0 z-50">
        <MultiplayerMemoryGame config={gameConfig} imagePackage={selectedPackage} onBack={handleBackFromGame} />
      </div>
    )
  }

  if (showGame && selectedPackage && gameConfig) {
    return (
      <div className="fixed inset-0 z-50">
        <MemoryGame config={gameConfig} imagePackage={selectedPackage} onBack={handleBackFromGame} />
      </div>
    )
  }

  if (showGameSetup && selectedPackage) {
    return <GameSetup selectedPackage={selectedPackage} onStartGame={handleStartGame} onBack={handleBackFromSetup} />
  }

  if (showEditor) {
    return <PackageEditor package={editingPackage} onSave={handleSavePackage} onCancel={handleCancelEdit} />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Paquetes de Imágenes</h2>
          <p className="text-white/80">Gestiona tus colecciones de imágenes para el memorama</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleImportPackage}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 bg-transparent"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar JSON
          </Button>
          <Button onClick={handleNewPackage} className="bg-white text-blue-600 hover:bg-white/90 font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Paquete
          </Button>
        </div>
      </div>

      {packages.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-white/60 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No hay paquetes</h3>
            <p className="text-white/80 text-center mb-6">Crea tu primer paquete de imágenes para comenzar a jugar</p>
            <Button onClick={handleNewPackage} className="bg-white text-blue-600 hover:bg-white/90">
              <Plus className="w-4 h-4 mr-2" />
              Crear Paquete
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const hasUrlImages = pkg.images.some((img) => img.url && !img.file)

            return (
              <Card
                key={pkg.id}
                className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-colors"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">{pkg.name}</CardTitle>
                      <CardDescription className="text-white/70">{pkg.description}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      <ImageIcon className="w-3 h-3 mr-1" />
                      {pkg.images.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Button
                      onClick={() => handlePlayGame(pkg)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                      disabled={pkg.images.length < 2}
                    >
                      🎮 Solo
                    </Button>
                    <Button
                      onClick={() => handlePlayMultiplayer(pkg)}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                      disabled={pkg.images.length < 2}
                      title="Requiere servidor WebSocket ejecutándose"
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Multi
                    </Button>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditPackage(pkg)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {hasUrlImages && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleExportPackage(pkg)}
                        className="border-blue-300/20 text-blue-300 hover:bg-blue-500/10"
                        title="Exportar como JSON"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="border-red-300/20 text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {pkg.images.length >= 2 ? (
                    <p className="text-green-300 text-sm">✓ Listo para jugar</p>
                  ) : (
                    <p className="text-yellow-300 text-sm">⚠ Necesita al menos 2 imágenes</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
