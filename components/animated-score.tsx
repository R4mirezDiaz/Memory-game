"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface AnimatedScoreProps {
  score: number
  previousScore: number
  playerName: string
}

export function AnimatedScore({ score, previousScore, playerName }: AnimatedScoreProps) {
  const [showFloatingScore, setShowFloatingScore] = useState(false)
  const scoreDiff = score - previousScore

  useEffect(() => {
    if (scoreDiff > 0) {
      setShowFloatingScore(true)
      const timer = setTimeout(() => setShowFloatingScore(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [scoreDiff])

  return (
    <div className="relative">
      <motion.div
        key={score}
        initial={{ scale: 1 }}
        animate={{ scale: scoreDiff > 0 ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.3 }}
        className="text-2xl font-bold text-white"
      >
        {score}
      </motion.div>

      <AnimatePresence>
        {showFloatingScore && scoreDiff > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -40, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.6 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute -top-8 left-1/2 transform -translate-x-1/2 pointer-events-none"
          >
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              +{scoreDiff}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
