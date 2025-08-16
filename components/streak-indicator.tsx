"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Zap } from "lucide-react"

interface StreakIndicatorProps {
  streak: number
  isActive: boolean
}

export function StreakIndicator({ streak, isActive }: StreakIndicatorProps) {
  if (streak === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <Badge
          variant="secondary"
          className={`
            ${isActive ? "bg-orange-500/30 text-orange-200 border-orange-400" : "bg-orange-500/20 text-orange-300"}
            transition-all duration-300
          `}
        >
          <motion.div
            animate={isActive ? { rotate: [0, 10, -10, 0] } : {}}
            transition={{ duration: 0.5, repeat: isActive ? Number.POSITIVE_INFINITY : 0, repeatDelay: 0.5 }}
          >
            <Zap className="w-3 h-3 mr-1" />
          </motion.div>
          {streak}

          {/* Fire trail effect for high streaks */}
          {streak >= 3 && (
            <motion.span
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 0.8,
                repeat: Number.POSITIVE_INFINITY,
              }}
              className="ml-1"
            >
              🔥
            </motion.span>
          )}
        </Badge>
      </motion.div>
    </AnimatePresence>
  )
}
