"use client"

import { motion } from "framer-motion"
import { Crown, Users, Shield, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface RoleIndicatorProps {
  isHost: boolean
  playerName: string
  playerColor: string
  compact?: boolean
}

export function RoleIndicator({ isHost, playerName, playerColor, compact = false }: RoleIndicatorProps) {
  if (compact) {
    return (
      <Badge
        variant="secondary"
        className={`
          ${
            isHost
              ? "bg-yellow-500/20 text-yellow-200 border-yellow-400/30"
              : "bg-blue-500/20 text-blue-200 border-blue-400/30"
          }
        `}
      >
        {isHost ? <Crown className="w-2 h-2 mr-1" /> : <Users className="w-2 h-2 mr-1" />}
        {isHost ? "Anfitrión" : "Invitado"}
      </Badge>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
      <Card
        className={`
        border-2 transition-all duration-300
        ${
          isHost
            ? "bg-yellow-500/10 border-yellow-400/30 shadow-lg shadow-yellow-400/10"
            : "bg-blue-500/10 border-blue-400/30 shadow-lg shadow-blue-400/10"
        }
      `}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                className="relative"
                animate={isHost ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: isHost ? Number.POSITIVE_INFINITY : 0 }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border-2 border-white/30"
                  style={{ backgroundColor: playerColor }}
                >
                  {playerName.charAt(0).toUpperCase()}
                </div>
                {isHost && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    <Crown className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </motion.div>

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-white font-semibold">{playerName}</h3>
                  {isHost ? (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-200">
                      <Crown className="w-3 h-3 mr-1" />
                      Anfitrión
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
                      <Users className="w-3 h-3 mr-1" />
                      Invitado
                    </Badge>
                  )}
                </div>
                <p className={`text-sm ${isHost ? "text-yellow-200" : "text-blue-200"}`}>
                  {isHost ? "Controla el juego" : "Participa en el juego"}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end space-y-1">
              {isHost ? (
                <div className="flex items-center space-x-1 text-yellow-200">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">Control total</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-blue-200">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs">Solo observa</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-white/20">
            {isHost ? (
              <div className="space-y-1">
                <p className="text-yellow-200 text-xs">✓ Puedes pausar y reiniciar el juego</p>
                <p className="text-yellow-200 text-xs">✓ Controlas el flujo del juego</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-blue-200 text-xs">• Espera tu turno para jugar</p>
                <p className="text-blue-200 text-xs">• El anfitrión controla el juego</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
