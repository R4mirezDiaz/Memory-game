import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'

// Tipos para el servidor
interface Player {
  id: string
  name: string
  color: string
  isHost: boolean
  isReady: boolean
  score: number
  wins: number
}

interface GameRoom {
  id: string
  players: Map<string, Player>
  gameState: 'waiting' | 'playing' | 'finished'
  currentTurn: string | null
  gameConfig: any
  imagePackage: any
  cards: any[]
  flippedCards: string[]
  matchedPairs: string[]
  createdAt: Date
}

interface WebSocketMessage {
  type: string
  payload: any
  roomId?: string
  playerId?: string
}

class MultiplayerGameServer {
  private wss: WebSocketServer
  private rooms: Map<string, GameRoom> = new Map()
  private playerConnections: Map<string, WebSocket> = new Map()
  private connectionToPlayer: Map<WebSocket, string> = new Map()

  constructor(port: number = 8080) {
    const server = createServer()
    this.wss = new WebSocketServer({ server })
    
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req)
    })

    server.listen(port, () => {
      console.log(`🎮 Servidor Multijugador ejecutándose en puerto ${port}`)
      console.log(`📱 URL de conexión: ws://localhost:${port}`)
    })

    // Limpiar salas vacías cada 5 minutos
    setInterval(() => {
      this.cleanupEmptyRooms()
    }, 5 * 60 * 1000)
  }

  private handleConnection(ws: WebSocket, req: any) {
    const playerId = this.generateId()
    console.log(`👤 Nueva conexión: ${playerId}`)

    // Registrar conexión
    this.playerConnections.set(playerId, ws)
    this.connectionToPlayer.set(ws, playerId)

    // Enviar confirmación de conexión
    this.sendToPlayer(playerId, {
      type: 'connection_established',
      payload: { playerId, timestamp: new Date().toISOString() }
    })

    // Manejar mensajes
    ws.on('message', (data) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString())
        this.handleMessage(playerId, message)
      } catch (error) {
        console.error(`❌ Error procesando mensaje de ${playerId}:`, error)
        this.sendError(playerId, 'Formato de mensaje inválido')
      }
    })

    // Manejar desconexión
    ws.on('close', () => {
      console.log(`👋 Jugador desconectado: ${playerId}`)
      this.handleDisconnection(playerId)
    })

    ws.on('error', (error) => {
      console.error(`🚨 Error WebSocket para ${playerId}:`, error)
    })
  }

  private handleMessage(playerId: string, message: WebSocketMessage) {
    console.log(`📨 Mensaje de ${playerId}:`, message.type)
    
    try {
      // Validar estructura del mensaje
      if (!message || typeof message.type !== 'string') {
        this.sendError(playerId, 'Formato de mensaje inválido')
        return
      }

      switch (message.type) {
        case 'create_room':
          if (!message.payload || typeof message.payload.playerName !== 'string') {
            this.sendError(playerId, 'Datos de creación de sala inválidos')
            return
          }
          this.createRoom(playerId, message.payload)
          break
        case 'join_room':
          if (!message.payload || typeof message.payload.roomId !== 'string' || typeof message.payload.playerName !== 'string') {
            this.sendError(playerId, 'Datos de unión a sala inválidos')
            return
          }
          this.joinRoom(playerId, message.payload)
          break
        case 'start_game':
          if (!message.payload || !message.payload.gameConfig || !message.payload.imagePackage) {
            this.sendError(playerId, 'Configuración de juego inválida')
            return
          }
          this.startGame(playerId, message.payload)
          break
        case 'flip_card':
          if (!message.payload || typeof message.payload.cardIndex !== 'number') {
            this.sendError(playerId, 'Índice de carta inválido')
            return
          }
          this.flipCard(playerId, message.payload)
          break
        case 'set_player_ready':
           if (!message.payload || typeof message.payload.isReady !== 'boolean') {
             this.sendError(playerId, 'Estado de preparación inválido')
             return
           }
           this.setPlayerReady(playerId, message.payload)
           break
        case 'restart_game':
          this.restartGame(playerId)
          break
        case 'leave_room':
          this.leaveRoom(playerId)
          break
        default:
          console.warn(`⚠️ Tipo de mensaje desconocido: ${message.type}`)
          this.sendError(playerId, `Tipo de mensaje no soportado: ${message.type}`)
      }
    } catch (error) {
      console.error(`❌ Error procesando mensaje de ${playerId}:`, error)
      this.sendError(playerId, 'Error interno del servidor')
    }
  }

  private createRoom(playerId: string, payload: any) {
    const roomId = payload.roomId || this.generateId()
    
    console.log(`🏠 Creando sala ${roomId} para jugador ${playerId}`)

    // Crear jugador host
    const player: Player = {
      id: playerId,
      name: payload.playerName || 'Host',
      color: this.getRandomColor(),
      isHost: true,
      isReady: false,
      score: 0,
      wins: 0
    }

    // Crear sala
    const room: GameRoom = {
      id: roomId,
      players: new Map([[playerId, player]]),
      gameState: 'waiting',
      currentTurn: null,
      gameConfig: null,
      imagePackage: null,
      cards: [],
      flippedCards: [],
      matchedPairs: [],
      createdAt: new Date()
    }

    this.rooms.set(roomId, room)
    
    console.log(`🏠 Sala creada: ${roomId} por ${payload.playerName || 'Host'} (${playerId})`)
    console.log(`📊 Total de salas activas: ${this.rooms.size}`)

    // Enviar confirmación
    this.sendToPlayer(playerId, {
      type: 'room_created',
      payload: {
        roomId,
        player,
        players: Array.from(room.players.values()),
        gameState: room.gameState
      }
    })

    console.log(`✅ Sala ${roomId} creada exitosamente`)
  }

  private joinRoom(playerId: string, payload: any) {
    const { roomId, playerName } = payload
    const room = this.rooms.get(roomId)

    if (!room) {
      console.log(`❌ Intento de unirse a sala inexistente: ${roomId} por ${playerName} (${playerId})`)
      this.sendError(playerId, 'Sala no encontrada')
      return
    }

    if (room.players.size >= 4) {
      console.log(`🚫 Intento de unirse a sala llena: ${roomId} por ${playerName} (${playerId})`)
      this.sendError(playerId, 'Sala llena')
      return
    }

    if (room.gameState !== 'waiting') {
      this.sendError(playerId, 'El juego ya ha comenzado')
      return
    }

    console.log(`👥 Jugador ${playerId} uniéndose a sala ${roomId}`)

    // Crear jugador
    const player: Player = {
      id: playerId,
      name: playerName || `Jugador ${room.players.size + 1}`,
      color: this.getRandomColor(),
      isHost: false,
      isReady: false,
      score: 0,
      wins: 0
    }

    // Agregar a la sala
    room.players.set(playerId, player)
    
    console.log(`👤 Jugador ${playerName || `Jugador ${room.players.size}`} (${playerId}) se unió a sala ${roomId}`)
    console.log(`👥 Jugadores en sala ${roomId}: ${room.players.size}/4`)

    // Enviar confirmación específica al jugador que se unió
    this.sendToPlayer(playerId, {
      type: 'join_success',
      payload: {
        playerId: playerId,
        roomId: roomId,
        player: player
      }
    })

    // Notificar a todos los jugadores
    this.broadcastToRoom(roomId, {
      type: 'player_joined',
      payload: {
        player,
        players: Array.from(room.players.values()),
        gameState: room.gameState,
        roomId: roomId
      }
    })

    console.log(`✅ Jugador ${playerId} se unió a sala ${roomId}`)
  }

  private startGame(playerId: string, payload: any) {
    const room = this.findPlayerRoom(playerId)
    if (!room) {
      this.sendError(playerId, 'No estás en ninguna sala')
      return
    }

    const player = room.players.get(playerId)
    if (!player?.isHost) {
      this.sendError(playerId, 'Solo el host puede iniciar el juego')
      return
    }

    if (room.players.size < 2) {
      this.sendError(playerId, 'Se necesitan al menos 2 jugadores')
      return
    }

    console.log(`🎮 Iniciando juego en sala ${room.id}`)

    // Configurar juego
    room.gameState = 'playing'
    room.gameConfig = payload.gameConfig
    room.imagePackage = payload.imagePackage
    room.cards = this.generateCards(payload.imagePackage)
    room.currentTurn = Array.from(room.players.keys())[0]
    room.flippedCards = []
    room.matchedPairs = []

    // Resetear puntuaciones
    room.players.forEach(p => p.score = 0)

    // Notificar inicio del juego
    this.broadcastToRoom(room.id, {
      type: 'game_started',
      payload: {
        gameState: room.gameState,
        cards: room.cards,
        currentTurn: room.currentTurn,
        players: Array.from(room.players.values())
      }
    })

    console.log(`✅ Juego iniciado en sala ${room.id}`)
  }

  private flipCard(playerId: string, payload: any) {
    const room = this.findPlayerRoom(playerId)
    if (!room || room.gameState !== 'playing') {
      this.sendError(playerId, 'No hay juego activo')
      return
    }

    if (room.currentTurn !== playerId) {
      this.sendError(playerId, 'No es tu turno')
      return
    }

    const { cardId } = payload
    const cardIndex = room.cards.findIndex(card => card.id === cardId)
    
    if (cardIndex === -1) {
      this.sendError(playerId, 'Carta no encontrada')
      return
    }
    
    if (room.flippedCards.includes(cardId) || room.matchedPairs.includes(cardId)) {
      this.sendError(playerId, 'Carta ya volteada')
      return
    }

    console.log(`🃏 Jugador ${playerId} voltea carta ${cardIndex}`)

    room.flippedCards.push(cardId)

    // Notificar carta volteada
    this.broadcastToRoom(room.id, {
      type: 'card_flipped',
      payload: {
        cardId,
        playerId,
        flippedCards: room.flippedCards
      }
    })

    // Verificar si se voltearon 2 cartas
    if (room.flippedCards.length === 2) {
      setTimeout(() => {
        this.checkMatch(room)
      }, 1500)
    }
  }

  private checkMatch(room: GameRoom) {
    const [card1Id, card2Id] = room.flippedCards
    const card1Index = room.cards.findIndex(card => card.id === card1Id)
    const card2Index = room.cards.findIndex(card => card.id === card2Id)
    const card1 = room.cards[card1Index]
    const card2 = room.cards[card2Index]

    const isMatch = card1.imageId === card2.imageId

    if (isMatch) {
      // Es una pareja - marcar cartas como emparejadas
      room.cards[card1Index].isMatched = true
      room.cards[card2Index].isMatched = true
      room.matchedPairs.push(card1Id, card2Id)
      
      const currentPlayer = room.players.get(room.currentTurn!)
      if (currentPlayer) {
        currentPlayer.score += 10
      }

      this.broadcastToRoom(room.id, {
        type: 'match_found',
        payload: {
          matchedCards: [card1Id, card2Id],
          playerId: room.currentTurn,
          score: currentPlayer?.score || 0,
          players: Array.from(room.players.values())
        }
      })

      // Verificar si el juego terminó
      if (room.matchedPairs.length === room.cards.length) {
        this.endGame(room)
        return
      }
    } else {
      // No es pareja
      this.broadcastToRoom(room.id, {
        type: 'no_match',
        payload: {
          flippedCards: room.flippedCards
        }
      })

      // Cambiar turno
      this.nextTurn(room)
    }

    room.flippedCards = []
  }

  private nextTurn(room: GameRoom) {
    const playerIds = Array.from(room.players.keys())
    const currentIndex = playerIds.indexOf(room.currentTurn!)
    const nextIndex = (currentIndex + 1) % playerIds.length
    room.currentTurn = playerIds[nextIndex]

    this.broadcastToRoom(room.id, {
      type: 'turn_changed',
      payload: {
        currentTurn: room.currentTurn
      }
    })
  }

  private endGame(room: GameRoom) {
    room.gameState = 'finished'
    
    // Determinar ganador
    const players = Array.from(room.players.values())
    const maxScore = Math.max(...players.map(p => p.score))
    const winners = players.filter(p => p.score === maxScore)
    
    let winner = null
    let isTie = false
    
    if (winners.length === 1) {
      winner = winners[0]
      winner.wins += 1 // Incrementar contador de victorias
    } else {
      isTie = true
    }

    this.broadcastToRoom(room.id, {
      type: 'game_ended',
      payload: {
        winner,
        isTie,
        players,
        gameState: room.gameState
      }
    })
  }

  private restartGame(playerId: string) {
    const room = this.findPlayerRoom(playerId)
    if (!room) {
      this.sendError(playerId, 'No estás en ninguna sala')
      return
    }

    if (room.gameState !== 'finished') {
      this.sendError(playerId, 'El juego debe haber terminado para reiniciar')
      return
    }

    // Solo el host puede reiniciar el juego
    const player = room.players.get(playerId)
    if (!player || !player.isHost) {
      this.sendError(playerId, 'Solo el anfitrión puede reiniciar el juego')
      return
    }

    console.log(`🔄 Reiniciando juego en sala ${room.id}`)

    // Verificar que tenemos la configuración del juego anterior
    if (!room.gameConfig || !room.imagePackage) {
      this.sendError(playerId, 'No se puede reiniciar: configuración del juego no encontrada')
      return
    }

    // Resetear estado del juego pero mantener jugadores y sus victorias
    room.gameState = 'playing'
    room.cards = this.generateCards(room.imagePackage)
    room.currentTurn = Array.from(room.players.keys())[0]
    room.flippedCards = []
    room.matchedPairs = []
    
    // Resetear puntuación de la partida actual pero mantener victorias
    room.players.forEach(player => {
      player.score = 0
      player.isReady = false
    })

    // Enviar el juego reiniciado con las nuevas cartas
    this.broadcastToRoom(room.id, {
       type: 'game_started',
       payload: {
         gameState: room.gameState,
         cards: room.cards,
         currentTurn: room.currentTurn,
         players: Array.from(room.players.values())
       }
     })

    console.log(`✅ Juego reiniciado exitosamente en sala ${room.id}`)
  }

  private setPlayerReady(playerId: string, payload: any) {
    const room = this.findPlayerRoom(playerId)
    if (!room) return

    const player = room.players.get(playerId)
    if (player) {
      player.isReady = payload.isReady
      
      this.broadcastToRoom(room.id, {
        type: 'player_ready_changed',
        payload: {
          playerId,
          isReady: player.isReady,
          players: Array.from(room.players.values())
        }
      })
    }
  }

  private leaveRoom(playerId: string) {
    const room = this.findPlayerRoom(playerId)
    if (!room) return

    console.log(`🚪 Jugador ${playerId} abandona sala ${room.id}`)

    const player = room.players.get(playerId)
    const wasHost = player?.isHost || false
    
    room.players.delete(playerId)

    if (room.players.size === 0) {
      // Eliminar sala vacía
      this.rooms.delete(room.id)
      console.log(`🗑️ Sala ${room.id} eliminada (vacía)`)
    } else {
      // Si el host se fue, asignar nuevo host
      if (wasHost) {
        const newHost = Array.from(room.players.values())[0]
        newHost.isHost = true
        
        this.broadcastToRoom(room.id, {
          type: 'new_host',
          payload: {
            newHostId: newHost.id,
            players: Array.from(room.players.values())
          }
        })
      }

      // Notificar que el jugador se fue
      this.broadcastToRoom(room.id, {
        type: 'player_left',
        payload: {
          playerId,
          players: Array.from(room.players.values())
        }
      })
    }
  }

  private handleDisconnection(playerId: string) {
    console.log(`🔌 Manejando desconexión del jugador ${playerId}`)
    this.leaveRoom(playerId)
    this.playerConnections.delete(playerId)
    
    // Limpiar referencia de conexión
    for (const [ws, id] of this.connectionToPlayer.entries()) {
      if (id === playerId) {
        this.connectionToPlayer.delete(ws)
        break
      }
    }
    console.log(`🧹 Limpieza de conexión completada para jugador ${playerId}`)
  }

  private findPlayerRoom(playerId: string): GameRoom | null {
    for (const room of this.rooms.values()) {
      if (room.players.has(playerId)) {
        return room
      }
    }
    return null
  }

  private sendToPlayer(playerId: string, message: any) {
    const ws = this.playerConnections.get(playerId)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }

  private broadcastToRoom(roomId: string, message: any) {
    const room = this.rooms.get(roomId)
    if (!room) return

    for (const playerId of room.players.keys()) {
      this.sendToPlayer(playerId, message)
    }
  }

  private sendError(playerId: string, message: string) {
    this.sendToPlayer(playerId, {
      type: 'error',
      payload: { message }
    })
  }

  private generateCards(imagePackage: any): any[] {
    const cards = []
    const images = imagePackage.images || []
    
    // Crear pares de cartas con el formato esperado por el cliente
    for (let i = 0; i < Math.min(images.length, 8); i++) {
      const image = images[i]
      cards.push(
        {
          id: `${image.id}_1`,
          imageId: image.id,
          imageUrl: image.url, // Mantener la URL original del cliente
          isFlipped: false,
          isMatched: false,
          position: i * 2
        },
        {
          id: `${image.id}_2`,
          imageId: image.id,
          imageUrl: image.url, // Mantener la URL original del cliente
          isFlipped: false,
          isMatched: false,
          position: i * 2 + 1
        }
      )
    }

    // Mezclar cartas y actualizar posiciones
    const shuffledCards = this.shuffleArray(cards)
    shuffledCards.forEach((card, index) => {
      card.position = index
    })
    
    return shuffledCards
  }

  private shuffleArray(array: any[]): any[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  private getRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  private cleanupEmptyRooms() {
    const now = new Date()
    for (const [roomId, room] of this.rooms.entries()) {
      const ageInMinutes = (now.getTime() - room.createdAt.getTime()) / (1000 * 60)
      if (room.players.size === 0 && ageInMinutes > 30) {
        this.rooms.delete(roomId)
        console.log(`🧹 Sala ${roomId} eliminada por inactividad`)
      }
    }
  }
}

// Iniciar servidor
new MultiplayerGameServer(8080)
