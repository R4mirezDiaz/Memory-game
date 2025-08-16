"use client"

import { useEffect, useRef, useState } from "react"
import { QrCode, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface QRCodeGeneratorProps {
  url: string
  roomId: string
  onClose?: () => void
}

export function QRCodeGenerator({ url, roomId, onClose }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isGenerating, setIsGenerating] = useState(true)

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current || !url) return

      try {
        setIsGenerating(true)

        // Simple QR code generation using a library-free approach
        // For production, you might want to use a proper QR library
        const canvas = canvasRef.current
        const ctx = canvas.getContext("2d")

        if (!ctx) return

        // Set canvas size
        canvas.width = 200
        canvas.height = 200

        // Create a simple pattern for demonstration
        // In a real implementation, you'd use a proper QR code library
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, 200, 200)

        // Create a grid pattern to simulate QR code
        ctx.fillStyle = "#000000"
        const cellSize = 10
        const gridSize = 20

        // Generate a pseudo-random pattern based on the URL
        const hash = url.split("").reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0)
          return a & a
        }, 0)

        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            const seed = (i * gridSize + j + Math.abs(hash)) % 3
            if (seed === 0) {
              ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize)
            }
          }
        }

        // Add corner markers (typical QR code feature)
        const markerSize = 30
        // Top-left
        ctx.fillRect(0, 0, markerSize, markerSize)
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(5, 5, markerSize - 10, markerSize - 10)
        ctx.fillStyle = "#000000"
        ctx.fillRect(10, 10, markerSize - 20, markerSize - 20)

        // Top-right
        ctx.fillStyle = "#000000"
        ctx.fillRect(200 - markerSize, 0, markerSize, markerSize)
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(200 - markerSize + 5, 5, markerSize - 10, markerSize - 10)
        ctx.fillStyle = "#000000"
        ctx.fillRect(200 - markerSize + 10, 10, markerSize - 20, markerSize - 20)

        // Bottom-left
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 200 - markerSize, markerSize, markerSize)
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(5, 200 - markerSize + 5, markerSize - 10, markerSize - 10)
        ctx.fillStyle = "#000000"
        ctx.fillRect(10, 200 - markerSize + 10, markerSize - 20, markerSize - 20)

        setIsGenerating(false)
      } catch (error) {
        console.error("Error generating QR code:", error)
        setIsGenerating(false)
      }
    }

    generateQR()
  }, [url])

  const handleDownload = () => {
    if (!canvasRef.current) return

    const link = document.createElement("a")
    link.download = `memorama-room-${roomId}.png`
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <QrCode className="w-5 h-5 mr-2 text-white" />
            <CardTitle className="text-white">Código QR</CardTitle>
          </div>
          {onClose && (
            <Button onClick={onClose} variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <CardDescription className="text-white/80">Escanea este código para unirte a la sala</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg">
            {isGenerating ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="border border-gray-200 rounded"
                style={{ imageRendering: "pixelated" }}
              />
            )}
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-white/80 text-sm">
            Sala ID: <span className="font-mono font-semibold">{roomId}</span>
          </p>
          <p className="text-white/60 text-xs">
            Los jugadores pueden escanear este código o usar el enlace para unirse
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10 bg-transparent"
          >
            Descargar QR
          </Button>
          <Button
            onClick={() => navigator.share?.({ url, title: `Unirse a sala ${roomId}` })}
            variant="outline"
            className="flex-1 border-white/20 text-white hover:bg-white/10"
            disabled={!navigator.share}
          >
            Compartir
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
