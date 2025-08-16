"use client"

import { useEffect, useState } from "react"
import { audioManager } from "@/lib/audio-manager"

export function useAudio() {
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [masterVolume, setMasterVolume] = useState(0.7)

  useEffect(() => {
    audioManager.setSoundEnabled(false)
    setSoundEnabled(false)
    setMasterVolume(audioManager.getMasterVolume())
  }, [])

  const toggleSound = () => {
    const newState = !soundEnabled
    setSoundEnabled(newState)
    audioManager.setSoundEnabled(newState)
  }

  const updateVolume = (volume: number) => {
    setMasterVolume(volume)
    audioManager.setMasterVolume(volume)
  }

  const playSound = (soundId: string, options?: { volume?: number; playbackRate?: number }) => {
    audioManager.playSound(soundId, options)
  }

  return {
    soundEnabled,
    masterVolume,
    toggleSound,
    updateVolume,
    playSound,
    // Convenience methods
    playCardFlip: () => audioManager.playCardFlip(),
    playMatchFound: () => audioManager.playMatchFound(),
    playNoMatch: () => audioManager.playNoMatch(),
    playGameWin: () => audioManager.playGameWin(),
    playButtonClick: () => audioManager.playButtonClick(),
    playStreakBonus: (level: number) => audioManager.playStreakBonus(level),
    playPerfectMatch: () => audioManager.playPerfectMatch(),
    startBackgroundMusic: () => audioManager.startBackgroundMusic(),
    stopBackgroundMusic: () => audioManager.stopBackgroundMusic(),
  }
}
