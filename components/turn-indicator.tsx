"use client"

import { motion } from "framer-motion"
import { Clock, User, Crown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TurnIndicatorProps {
  currentPlayerName: string
  currentPlayerColor: string
  isMyTurn: boolean
  isHost: boolean
  timeRemaining?: number
  disabled?: boolean
}

export function TurnIndicator({
  currentPlayerName,
  currentPlayerColor,
  isMyTurn,
  isHost,
  timeRemaining,
  disabled = false,
}: TurnIndicatorProps) {
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
      <Card
        className={`
        transition-all duration-300 border-2
        ${isMyTurn ? "bg-green-500/20 border-green-400 shadow-lg shadow-green-400/20" : "bg-white/10 border-white/20"}
        ${disabled ? "opacity-50" : ""}
      `}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                className="relative"
                animate={isMyTurn ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: isMyTurn ? Number.POSITIVE_INFINITY : 0 }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border-2 border-white/30"
                  style={{ backgroundColor: currentPlayerColor }}
                >
                  {currentPlayerName.charAt(0).toUpperCase()}
                </div>
                {isMyTurn && (
                  <motion.div
                    className="absolute -inset-1 rounded-full border-2 border-green-400"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                )}
              </motion.div>

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-white font-semibold">{currentPlayerName}</h3>
                  {isHost && <Crown className="w-4 h-4 text-yellow-400" />}
                </div>
                <p className={`text-sm ${isMyTurn ? "text-green-200" : "text-white/60"}`}>
                  {isMyTurn ? "¡Tu turno!" : "Esperando..."}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {timeRemaining !== undefined && (
                <Badge
                  variant="secondary"
                  className={`
                    ${timeRemaining <= 10 ? "bg-red-500/20 text-red-200" : "bg-white/20 text-white"}
                  `}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {timeRemaining}s
                </Badge>
              )}

              <Badge
                variant="secondary"
                className={`
                  ${isMyTurn ? "bg-green-500/20 text-green-200" : "bg-white/20 text-white"}
                `}
              >
                <User className="w-3 h-3 mr-1" />
                {isMyTurn ? "Activo" : "Esperando"}
              </Badge>
            </div>
          </div>

          {isMyTurn && !disabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 pt-3 border-t border-green-400/30"
            >
              <p className="text-green-200 text-sm text-center">💡 Selecciona dos cartas para encontrar una pareja</p>
            </motion.div>
          )}

          {!isMyTurn && !disabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 pt-3 border-t border-white/20"
            >
              <p className="text-white/60 text-sm text-center">Espera tu turno para jugar</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
