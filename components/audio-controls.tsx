"use client"

import { Volume2, VolumeX, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAudio } from "@/hooks/use-audio"

interface AudioControlsProps {
  showBackgroundMusic?: boolean
}

export function AudioControls({ showBackgroundMusic = true }: AudioControlsProps) {
  const { soundEnabled, masterVolume, toggleSound, updateVolume, startBackgroundMusic, stopBackgroundMusic } =
    useAudio()

  const handleVolumeChange = (value: number[]) => {
    updateVolume(value[0])
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="sound-toggle" className="text-white flex items-center gap-2">
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            Efectos de Sonido
          </Label>
          <Switch id="sound-toggle" checked={soundEnabled} onCheckedChange={toggleSound} />
        </div>

        {soundEnabled && (
          <div className="space-y-3">
            <div>
              <Label className="text-white text-sm">Volumen: {Math.round(masterVolume * 100)}%</Label>
              <Slider
                value={[masterVolume]}
                onValueChange={handleVolumeChange}
                max={1}
                min={0}
                step={0.1}
                className="mt-2"
              />
            </div>

            {showBackgroundMusic && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startBackgroundMusic}
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent flex-1"
                >
                  <Music className="w-4 h-4 mr-2" />
                  Música
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopBackgroundMusic}
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  Parar
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
