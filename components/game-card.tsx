"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Card as GameCardType } from "@/types/game"

interface GameCardProps {
  card: GameCardType
  onClick: () => void
  disabled: boolean
  index?: number
  cardSize?: number // Added cardSize prop for responsive sizing
}

export function GameCard({ card, onClick, disabled, index = 0, cardSize = 120 }: GameCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isClicked, setIsClicked] = useState(false)

  const handleClick = () => {
    if (!disabled) {
      setIsClicked(true)
      setTimeout(() => setIsClicked(false), 200)
      onClick()
    }
  }

  const getTextSize = () => {
    if (cardSize < 80) return "text-sm"
    if (cardSize < 120) return "text-lg"
    if (cardSize < 160) return "text-xl"
    return "text-2xl"
  }

  const getIconSize = () => {
    if (cardSize < 80) return "text-lg"
    if (cardSize < 120) return "text-xl"
    if (cardSize < 160) return "text-2xl"
    return "text-3xl"
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4, // Reduced from 0.6 to 0.4 for faster initial animation
        delay: index * 0.03, // Reduced from 0.05 to 0.03 for faster staggered animation
        type: "spring",
        stiffness: 150, // Increased from 100 to 150 for snappier animation
        damping: 15, // Added damping for smoother animation
      }}
      whileHover={!disabled ? { scale: window.innerWidth < 768 ? 1.02 : 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      style={{ width: `${cardSize}px`, height: `${cardSize}px` }}
    >
      <div
        className={`
          w-full h-full cursor-pointer relative
          ${disabled && !card.isFlipped && !card.isMatched ? "cursor-not-allowed opacity-75" : ""}
        `}
        style={{
          perspective: "1000px",
        }}
        onClick={handleClick}
      >
        <motion.div
          className="relative w-full h-full"
          style={{
            transformStyle: "preserve-3d",
          }}
          animate={{
            rotateY: card.isFlipped || card.isMatched ? 180 : 0,
          }}
          transition={{
            duration: 0.4, // Reduced from 0.6 to 0.4 for faster flip animation
            type: "spring",
            stiffness: 150, // Increased from 100 to 150 for snappier flip
            damping: 15, // Added damping for smoother flip
          }}
        >
          {/* Back Face - Question Mark */}
          <div
            className="absolute inset-0 w-full h-full border-white/20 shadow-lg border-0"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(0deg)",
            }}
          >
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 relative rounded-lg overflow-hidden">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3, // Increased from 2 to 3 for slower, less distracting animation
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 2, // Increased delay to reduce animation frequency
                  ease: "easeInOut", // Added easing for smoother animation
                }}
                className={`text-white ${getIconSize()} drop-shadow-lg font-bold`}
              >
                ❓
              </motion.div>
              {/* Decorative elements - simplified for better performance */}
              <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full bg-gradient-to-br from-white/20 to-transparent rounded-lg"></div>
                <div
                  className="absolute top-2 left-2 bg-white/20 rounded-full"
                  style={{
                    width: `${Math.max(8, cardSize * 0.08)}px`,
                    height: `${Math.max(8, cardSize * 0.08)}px`,
                  }}
                ></div>
                <div
                  className="absolute bottom-2 right-2 bg-white/15 rounded-full"
                  style={{
                    width: `${Math.max(6, cardSize * 0.06)}px`,
                    height: `${Math.max(6, cardSize * 0.06)}px`,
                  }}
                ></div>
              </div>
              {/* Hover glow effect - optimized */}
              <motion.div
                className="absolute inset-0 bg-white/5 rounded-lg opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.15 }} // Reduced from 0.2 to 0.15 for snappier hover
              />
            </div>
          </div>

          {/* Front Face - Image */}
          <div
            className={`
              absolute inset-0 w-full h-full border border-white/20 shadow-lg
              ${card.isMatched ? "ring-2 ring-green-400 ring-opacity-75 shadow-green-400/50" : ""}
            `}
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="w-full h-full flex items-center justify-center bg-white rounded-lg p-1">
              {/* Replaced dynamic padding with fixed p-1 for better performance */}
              {imageError ? (
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 0.8, // Increased from 0.5 for slower, less jarring animation
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 3, // Increased delay to reduce animation frequency
                      ease: "easeInOut", // Added easing
                    }}
                    className={`${getIconSize()} mb-1`}
                  >
                    ❓
                  </motion.div>
                  {cardSize > 100 && <p className={`${getTextSize()} text-gray-600`}>Error</p>}
                </div>
              ) : (
                <motion.img
                  src={card.imageUrl || "/placeholder.svg"}
                  alt="Memory card"
                  className="max-w-full max-h-full object-contain rounded"
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                  initial={{ scale: 0.9, opacity: 0 }} // Reduced initial scale from 0.8 to 0.9 for subtler animation
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }} // Reduced from 0.3 to 0.2 for faster image reveal
                />
              )}
              {/* Match celebration effect - optimized */}
              <AnimatePresence>
                {card.isMatched && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }} // Added explicit transition for celebration effect
                    className="absolute inset-0 bg-green-400/20 rounded-lg flex items-center justify-center"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 1.5, // Increased from 1 to 1.5 for slower celebration animation
                        repeat: Number.POSITIVE_INFINITY,
                        repeatDelay: 2, // Increased delay to reduce animation frequency
                        ease: "easeInOut", // Added easing
                      }}
                      className={getIconSize()}
                    >
                      ✨
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
