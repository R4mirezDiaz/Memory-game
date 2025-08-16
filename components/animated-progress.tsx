"use client"

import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"

interface AnimatedProgressProps {
  value: number
  className?: string
}

export function AnimatedProgress({ value, className }: AnimatedProgressProps) {
  return (
    <div className={`relative ${className}`}>
      <Progress value={value} className="h-3" />

      {/* Animated glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent h-3 rounded-full"
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatDelay: 1,
          ease: "easeInOut",
        }}
        style={{
          maskImage: `linear-gradient(to right, transparent 0%, black ${value}%, transparent ${value + 5}%)`,
        }}
      />

      {/* Sparkle effects at progress end */}
      {value > 0 && (
        <motion.div
          className="absolute right-0 top-1/2 transform -translate-y-1/2"
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
          }}
        >
          <span className="text-yellow-400 text-xs">✨</span>
        </motion.div>
      )}
    </div>
  )
}
