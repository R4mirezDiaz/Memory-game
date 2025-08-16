"use client"

export interface SoundEffect {
  id: string
  name: string
  url: string
  volume?: number
  loop?: boolean
}

export class AudioManager {
  private static instance: AudioManager
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  private soundInstances: Map<string, HTMLAudioElement> = new Map()
  private masterVolume = 0.7
  private soundEnabled = true

  private constructor() {
    if (typeof window !== "undefined") {
      this.initializeAudio()
    }
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  private async initializeAudio() {
    try {
      // Create audio context for better sound management
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Load default sound effects
      await this.loadDefaultSounds()
    } catch (error) {
      console.warn("Audio initialization failed:", error)
    }
  }

  private async loadDefaultSounds() {
    const defaultSounds: SoundEffect[] = [
      { id: "card-flip", name: "Card Flip", url: "/sounds/card-flip.mp3", volume: 0.6 },
      { id: "match-found", name: "Match Found", url: "/sounds/match-found.mp3", volume: 0.8 },
      { id: "no-match", name: "No Match", url: "/sounds/no-match.mp3", volume: 0.5 },
      { id: "game-win", name: "Game Win", url: "/sounds/game-win.mp3", volume: 0.9 },
      { id: "button-click", name: "Button Click", url: "/sounds/button-click.mp3", volume: 0.4 },
      { id: "streak-bonus", name: "Streak Bonus", url: "/sounds/streak-bonus.mp3", volume: 0.7 },
      { id: "perfect-match", name: "Perfect Match", url: "/sounds/perfect-match.mp3", volume: 0.8 },
      {
        id: "background-music",
        name: "Background Music",
        url: "/sounds/background-music.mp3",
        volume: 0.3,
        loop: true,
      },
    ]

    // Create fallback audio elements for each sound
    for (const sound of defaultSounds) {
      try {
        const audio = new Audio()
        audio.preload = "auto"
        audio.volume = (sound.volume || 0.5) * this.masterVolume
        audio.loop = sound.loop || false

        // Use data URLs for placeholder sounds since we can't load external files
        audio.src = this.generatePlaceholderSound(sound.id)

        this.soundInstances.set(sound.id, audio)
      } catch (error) {
        console.warn(`Failed to load sound ${sound.id}:`, error)
      }
    }
  }

  private generatePlaceholderSound(soundId: string): string {
    // Generate simple beep sounds using data URLs for different sound types
    const frequency = this.getSoundFrequency(soundId)
    const duration = this.getSoundDuration(soundId)

    // Create a simple sine wave audio data URL
    return this.createBeepDataURL(frequency, duration)
  }

  private getSoundFrequency(soundId: string): number {
    const frequencies: Record<string, number> = {
      "card-flip": 800,
      "match-found": 1200,
      "no-match": 400,
      "game-win": 1600,
      "button-click": 1000,
      "streak-bonus": 1400,
      "perfect-match": 1800,
      "background-music": 440,
    }
    return frequencies[soundId] || 800
  }

  private getSoundDuration(soundId: string): number {
    const durations: Record<string, number> = {
      "card-flip": 0.2,
      "match-found": 0.5,
      "no-match": 0.3,
      "game-win": 2.0,
      "button-click": 0.1,
      "streak-bonus": 0.7,
      "perfect-match": 0.8,
      "background-music": 10.0,
    }
    return durations[soundId] || 0.3
  }

  private createBeepDataURL(frequency: number, duration: number): string {
    if (!this.audioContext) return ""

    const sampleRate = this.audioContext.sampleRate
    const numSamples = Math.floor(sampleRate * duration)
    const buffer = new ArrayBuffer(44 + numSamples * 2)
    const view = new DataView(buffer)

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, "RIFF")
    view.setUint32(4, 36 + numSamples * 2, true)
    writeString(8, "WAVE")
    writeString(12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, "data")
    view.setUint32(40, numSamples * 2, true)

    // Generate sine wave
    for (let i = 0; i < numSamples; i++) {
      const sample = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 0.3
      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)))
      view.setInt16(44 + i * 2, intSample, true)
    }

    const blob = new Blob([buffer], { type: "audio/wav" })
    return URL.createObjectURL(blob)
  }

  async playSound(soundId: string, options?: { volume?: number; playbackRate?: number }) {
    if (!this.soundEnabled) return

    const audio = this.soundInstances.get(soundId)
    if (!audio) {
      console.warn(`Sound ${soundId} not found`)
      return
    }

    try {
      // Reset audio to beginning
      audio.currentTime = 0

      // Apply options
      if (options?.volume !== undefined) {
        audio.volume = Math.min(1, Math.max(0, options.volume * this.masterVolume))
      }

      if (options?.playbackRate !== undefined) {
        audio.playbackRate = Math.min(4, Math.max(0.25, options.playbackRate))
      }

      await audio.play()
    } catch (error) {
      console.warn(`Failed to play sound ${soundId}:`, error)
    }
  }

  stopSound(soundId: string) {
    const audio = this.soundInstances.get(soundId)
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }

  setMasterVolume(volume: number) {
    this.masterVolume = Math.min(1, Math.max(0, volume))

    // Update all sound volumes
    this.soundInstances.forEach((audio) => {
      const baseVolume = Number.parseFloat(audio.dataset.baseVolume || "0.5")
      audio.volume = baseVolume * this.masterVolume
    })
  }

  getMasterVolume(): number {
    return this.masterVolume
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled

    if (!enabled) {
      // Stop all currently playing sounds
      this.soundInstances.forEach((audio) => {
        audio.pause()
        audio.currentTime = 0
      })
    }
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled
  }

  // Convenience methods for common game sounds
  playCardFlip() {
    this.playSound("card-flip", { playbackRate: 0.8 + Math.random() * 0.4 })
  }

  playMatchFound() {
    this.playSound("match-found")
  }

  playNoMatch() {
    this.playSound("no-match")
  }

  playGameWin() {
    this.playSound("game-win")
  }

  playButtonClick() {
    this.playSound("button-click")
  }

  playStreakBonus(streakLevel: number) {
    const playbackRate = 1 + (streakLevel - 1) * 0.1
    this.playSound("streak-bonus", { playbackRate })
  }

  playPerfectMatch() {
    this.playSound("perfect-match")
  }

  startBackgroundMusic() {
    this.playSound("background-music")
  }

  stopBackgroundMusic() {
    this.stopSound("background-music")
  }
}

// Create singleton instance
export const audioManager = AudioManager.getInstance()
