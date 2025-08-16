"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Particle {
  id: number
  x: number
  y: number
  color: string
  emoji: string
}

interface ParticleEffectProps {
  trigger: boolean
  onComplete?: () => void
}

export function ParticleEffect({ trigger, onComplete }: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  const emojis = ["⭐", "✨", "🎉", "💫", "🌟", "🎊"]
  const colors = ["#FFD700", "#FF69B4", "#00CED1", "#FF6347", "#98FB98", "#DDA0DD"]

  useEffect(() => {
    if (trigger) {
      const newParticles: Particle[] = []
      for (let i = 0; i < 12; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 200 - 100,
          y: Math.random() * 200 - 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
        })
      }
      setParticles(newParticles)

      const timer = setTimeout(() => {
        setParticles([])
        onComplete?.()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [trigger, onComplete])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: "50vw",
              y: "50vh",
              scale: 0,
              rotate: 0,
            }}
            animate={{
              x: `calc(50vw + ${particle.x}px)`,
              y: `calc(50vh + ${particle.y}px)`,
              scale: [0, 1.5, 0],
              rotate: 360,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2,
              ease: "easeOut",
            }}
            className="absolute text-2xl"
            style={{ color: particle.color }}
          >
            {particle.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
