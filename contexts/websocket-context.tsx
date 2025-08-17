"use client"

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'

// Tipos para el cliente
interface Player {
  id: string
  name: string
  color: string
  isHost: boolean
  isReady: boolean
  score: number
  wins: number
}

interface GameState {
  roomId: string | null
  playerId: string | null
  players: Player[]
  gameState: 'waiting' | 'playing' | 'finished'
  currentTurn: string | null
  cards: any[]
  flippedCards: number[]
  matchedPairs: number[]
  isHost: boolean
  isConnected: boolean
  error: string | null
}

interface WebSocketContextType {
  // Estado
  gameState: GameState
  isConnected: boolean
  roomId: string | null
  
  // Acciones
  connect: () => void
  disconnect: () => void
  createRoom: (playerName: string, gameConfig?: any) => void
  joinRoom: (roomId: string, playerName: string) => void
  startGame: (gameConfig: any, imagePackage: any) => void
  flipCard: (cardId: string) => void
  setPlayerReady: (isReady: boolean) => void
  restartGame: () => void
  leaveRoom: () => void
  
  // Utilidades
  clearError: () => void
  getRoomUrl: () => string
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

const WEBSOCKET_URL = 'ws://localhost:8080'
const RECONNECT_INTERVAL = 3000
const MAX_RECONNECT_ATTEMPTS = 5

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>({
    roomId: null,
    playerId: null,
    players: [],
    gameState: 'waiting',
    currentTurn: null,
    cards: [],
    flippedCards: [],
    matchedPairs: [],
    isHost: false,
    isConnected: false,
    error: null
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const isConnectingRef = useRef(false)

  // Función para conectar al WebSocket
  const connect = useCallback(() => {
    console.log('🔌 [WebSocket] Intentando conectar...', {
      isConnecting: isConnectingRef.current,
      currentState: wsRef.current?.readyState,
      url: WEBSOCKET_URL
    })
    
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      console.log('⚠️ [WebSocket] Ya hay una conexión activa o en progreso')
      return
    }

    isConnectingRef.current = true
    console.log('🔌 [WebSocket] Creando nueva conexión...')

    try {
      const ws = new WebSocket(WEBSOCKET_URL)
      wsRef.current = ws
      console.log('📡 [WebSocket] WebSocket creado, esperando conexión...')

      ws.onopen = () => {
        console.log('✅ [WebSocket] Conexión establecida exitosamente')
        isConnectingRef.current = false
        reconnectAttemptsRef.current = 0
        
        setGameState(prev => ({
          ...prev,
          isConnected: true,
          error: null
        }))
      }

      ws.onmessage = (event) => {
        console.log('📥 [WebSocket] Mensaje recibido:', event.data)
        try {
          const message = JSON.parse(event.data)
          handleMessage(message)
        } catch (error) {
          console.error('❌ [WebSocket] Error procesando mensaje:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('🔌 [WebSocket] Conexión cerrada:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          reconnectAttempts: reconnectAttemptsRef.current
        })
        isConnectingRef.current = false
        
        setGameState(prev => ({
          ...prev,
          isConnected: false
        }))

        // Intentar reconectar si no fue intencional
        if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          console.log('🔄 [WebSocket] Programando reconexión...')
          scheduleReconnect()
        } else if (event.code === 1000) {
          console.log('✅ [WebSocket] Desconexión limpia (código 1000)')
        }
      }

      ws.onerror = (error) => {
        console.error('🚨 [WebSocket] Error de conexión:', {
          error,
          readyState: ws.readyState,
          url: WEBSOCKET_URL
        })
        isConnectingRef.current = false
        
        setGameState(prev => ({
          ...prev,
          isConnected: false,
          error: 'Error de conexión con el servidor'
        }))
      }

    } catch (error) {
      console.error('❌ [WebSocket] Error creando WebSocket:', {
        error,
        url: WEBSOCKET_URL
      })
      isConnectingRef.current = false
      
      setGameState(prev => ({
        ...prev,
        error: 'No se pudo conectar al servidor'
      }))
    }
  }, [])

  // Función para desconectar
  const disconnect = useCallback(() => {
    console.log('🔌 [WebSocket] Iniciando desconexión manual...', {
      currentState: wsRef.current?.readyState,
      hasReconnectTimeout: !!reconnectTimeoutRef.current
    })
    
    if (reconnectTimeoutRef.current) {
      console.log('⏹️ [WebSocket] Cancelando timeout de reconexión')
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      console.log('🔌 [WebSocket] Cerrando conexión con código 1000')
      wsRef.current.close(1000, 'Desconexión intencional')
      wsRef.current = null
    }

    setGameState(prev => ({
      ...prev,
      isConnected: false
    }))
    console.log('✅ [WebSocket] Desconexión completada')
  }, [])

  // Programar reconexión
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return

    reconnectAttemptsRef.current++
    console.log(`🔄 Reintentando conexión (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`)

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null
      connect()
    }, RECONNECT_INTERVAL)
  }, [connect])

  // Enviar mensaje al servidor
  const sendMessage = useCallback((type: string, payload: any = {}) => {
    // Validar parámetros
    if (!type || typeof type !== 'string') {
      console.error('❌ [WebSocket] Tipo de mensaje inválido:', type)
      setGameState(prev => ({
        ...prev,
        error: 'Tipo de mensaje inválido'
      }))
      return false
    }

    console.log('📤 [WebSocket] Intentando enviar mensaje:', {
      type,
      payload,
      wsState: wsRef.current?.readyState,
      isConnected: gameState.isConnected,
      roomId: gameState.roomId,
      playerId: gameState.playerId
    })
    
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ [WebSocket] No se puede enviar mensaje - WebSocket no conectado:', {
        wsExists: !!wsRef.current,
        readyState: wsRef.current?.readyState,
        expectedState: WebSocket.OPEN
      })
      setGameState(prev => ({
        ...prev,
        error: 'No hay conexión con el servidor'
      }))
      // Intentar reconectar si no está conectado
      if (!isConnectingRef.current) {
        connect()
      }
      return false
    }

    try {
      const message = {
        type,
        payload,
        roomId: gameState.roomId,
        playerId: gameState.playerId
      }
      
      wsRef.current.send(JSON.stringify(message))
      console.log('✅ [WebSocket] Mensaje enviado exitosamente:', {
        type,
        payload,
        messageSize: JSON.stringify(message).length
      })
      return true
    } catch (error) {
      console.error('❌ [WebSocket] Error enviando mensaje:', {
        error,
        type,
        payload
      })
      setGameState(prev => ({
        ...prev,
        error: 'Error enviando mensaje al servidor'
      }))
      return false
    }
  }, [gameState.roomId, gameState.playerId, gameState.isConnected, connect])

  // Manejar mensajes del servidor
  const handleMessage = useCallback((message: any) => {
    console.log('📥 [WebSocket] Procesando mensaje:', {
      type: message.type,
      payload: message.payload,
      roomId: message.roomId,
      playerId: message.playerId,
      timestamp: new Date().toISOString()
    })

    // Validar estructura del mensaje
    if (!message || typeof message.type !== 'string') {
      console.error('❌ [WebSocket] Mensaje con formato inválido:', message)
      setGameState(prev => ({
        ...prev,
        error: 'Mensaje del servidor con formato inválido'
      }))
      return
    }

    switch (message.type) {
      case 'connection_established':
        setGameState(prev => ({
          ...prev,
          playerId: message.payload.playerId,
          error: null
        }))
        break

      case 'room_created':
        setGameState(prev => ({
          ...prev,
          roomId: message.payload.roomId,
          players: message.payload.players,
          gameState: message.payload.gameState,
          isHost: true,
          error: null
        }))
        break

      case 'join_success':
        setGameState(prev => ({
          ...prev,
          playerId: message.payload.playerId,
          roomId: message.payload.roomId
        }))
        break

      case 'player_joined':
        setGameState(prev => ({
          ...prev,
          roomId: message.payload.roomId || prev.roomId,
          players: message.payload.players,
          gameState: message.payload.gameState
        }))
        break

      case 'player_left':
        setGameState(prev => ({
          ...prev,
          players: message.payload.players
        }))
        break

      case 'new_host':
        setGameState(prev => {
          const isNewHost = prev.playerId === message.payload.newHostId
          return {
            ...prev,
            players: message.payload.players,
            isHost: isNewHost
          }
        })
        break

      case 'game_started':
        setGameState(prev => ({
          ...prev,
          gameState: message.payload.gameState,
          cards: message.payload.cards,
          currentTurn: message.payload.currentTurn,
          players: message.payload.players,
          flippedCards: [],
          matchedPairs: []
        }))
        break

      case 'card_flipped':
        setGameState(prev => ({
          ...prev,
          flippedCards: message.payload.flippedCards
        }))
        break

      case 'match_found':
        setGameState(prev => ({
          ...prev,
          matchedPairs: [...prev.matchedPairs, ...message.payload.matchedCards],
          players: message.payload.players,
          flippedCards: []
        }))
        break

      case 'no_match':
        // Las cartas se voltearán de vuelta después de un delay
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            flippedCards: []
          }))
        }, 1000)
        break

      case 'turn_changed':
        setGameState(prev => ({
          ...prev,
          currentTurn: message.payload.currentTurn
        }))
        break

      case 'game_ended':
        setGameState(prev => ({
          ...prev,
          gameState: message.payload.gameState,
          players: message.payload.players
        }))
        break

      case 'game_restarted':
        setGameState(prev => ({
          ...prev,
          gameState: message.payload.gameState,
          players: message.payload.players,
          cards: [],
          flippedCards: [],
          matchedPairs: [],
          currentTurn: null
        }))
        break

      case 'player_ready_changed':
        setGameState(prev => ({
          ...prev,
          players: message.payload.players
        }))
        break

      case 'error':
        console.error('🚨 Error del servidor:', message.payload.message)
        setGameState(prev => ({
          ...prev,
          error: message.payload.message
        }))
        break

      default:
        console.warn('⚠️ Tipo de mensaje desconocido:', message.type)
    }
  }, [])

  // Acciones del juego
  const createRoom = useCallback((playerName: string, gameConfig?: any) => {
    const roomId = Math.random().toString(36).substring(2, 15)
    sendMessage('create_room', { roomId, playerName, gameConfig })
  }, [sendMessage])

  const joinRoom = useCallback((roomId: string, playerName: string) => {
    sendMessage('join_room', { roomId, playerName })
  }, [sendMessage])

  const startGame = useCallback((gameConfig: any, imagePackage: any) => {
    sendMessage('start_game', { gameConfig, imagePackage })
  }, [sendMessage])

  const flipCard = useCallback((cardId: string) => {
    sendMessage('flip_card', { cardId })
  }, [sendMessage])

  const setPlayerReady = useCallback((isReady: boolean) => {
    sendMessage('player_ready', { isReady })
  }, [sendMessage])

  const restartGame = useCallback(() => {
    sendMessage('restart_game')
  }, [sendMessage])

  const leaveRoom = useCallback(() => {
    sendMessage('leave_room')
    setGameState(prev => ({
      ...prev,
      roomId: null,
      players: [],
      gameState: 'waiting',
      currentTurn: null,
      cards: [],
      flippedCards: [],
      matchedPairs: [],
      isHost: false
    }))
  }, [sendMessage])

  const clearError = useCallback(() => {
    setGameState(prev => ({ ...prev, error: null }))
  }, [])

  const getRoomUrl = useCallback(() => {
    if (!gameState.roomId) return ''
    return `${window.location.origin}?room=${gameState.roomId}`
  }, [gameState.roomId])

  // Conectar automáticamente al montar
  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  const contextValue: WebSocketContextType = {
    gameState,
    isConnected: gameState.isConnected,
    roomId: gameState.roomId,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    startGame,
    flipCard,
    setPlayerReady,
    restartGame,
    leaveRoom,
    clearError,
    getRoomUrl
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket debe usarse dentro de WebSocketProvider')
  }
  return context
}

export default WebSocketContext