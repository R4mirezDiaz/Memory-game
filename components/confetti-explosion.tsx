"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface ConfettiPiece {
  id: number
  x: number
  y: number
  rotation: number
  color: string
  size: number
}

interface ConfettiExplosionProps {
  trigger: boolean
  duration?: number
}

export function ConfettiExplosion({ trigger, duration = 3000 }: ConfettiExplosionProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])

  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"]

  useEffect(() => {
    if (trigger) {
      const pieces: ConfettiPiece[] = []
      for (let i = 0; i < 50; i++) {
        pieces.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: -20,
          rotation: Math.random() * 360,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
        })
      }
      setConfetti(pieces)

      const timer = setTimeout(() => {
        setConfetti([])
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [trigger, duration])

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      <AnimatePresence>
        {confetti.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{
              x: piece.x,
              y: piece.y,
              rotate: piece.rotation,
              opacity: 1,
            }}
            animate={{
              y: window.innerHeight + 100,
              rotate: piece.rotation + 720,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: Math.random() * 2 + 2,
              ease: "easeIn",
            }}
            className="absolute rounded-sm"
            style={{
              backgroundColor: piece.color,
              width: piece.size,
              height: piece.size,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
