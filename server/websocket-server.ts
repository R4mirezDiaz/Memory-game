import { WebSocketServer, WebSocket } from "ws"
import { createServer } from "http"
import { parse } from "url"

interface Player {
  id: string
  name: string
  color: string
  score: number
  isHost: boolean
  ws: WebSocket
}

interface GameCard {
  id: string
  imageUrl: string
  isFlipped: boolean
  isMatched: boolean
  position: number
}

interface GameRoom {
  id: string
  hostId: string
  players: Map<string, Player>
  gameState: {
    cards: GameCard[]
    currentPlayerIndex: number
    flippedCards: string[]
    isGameStarted: boolean
    isGameEnded: boolean
    gameConfig: any
    imagePackage: any
  }
  createdAt: Date
}

class MemoryGameServer {
  private wss: WebSocketServer
  private rooms: Map<string, GameRoom> = new Map()
  private playerToRoom: Map<string, string> = new Map()

  constructor(port = 8080) {
    const server = createServer()
    this.wss = new WebSocketServer({ server })

    this.wss.on("connection", this.handleConnection.bind(this))

    server.listen(port, () => {
      console.log(`🎮 Memory Game WebSocket Server running on port ${port}`)
      console.log(`📱 Connect clients to: ws://localhost:${port}`)
    })

    // Clean up inactive rooms every 5 minutes
    setInterval(this.cleanupRooms.bind(this), 5 * 60 * 1000)
  }

  private handleConnection(ws: WebSocket, request: any) {
    const { query } = parse(request.url, true)
    const playerId = this.generateId()

    console.log(`👤 New connection: ${playerId}`)

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString())
        this.handleMessage(ws, playerId, message)
      } catch (error) {
        console.error("❌ Error parsing message:", error)
        this.sendError(ws, "Invalid message format")
      }
    })

    ws.on("close", () => {
      console.log(`👋 Player disconnected: ${playerId}`)
      this.handleDisconnection(playerId)
    })

    ws.on("error", (error) => {
      console.error(`🚨 WebSocket error for ${playerId}:`, error)
    })
  }

  private handleMessage(ws: WebSocket, playerId: string, message: any) {
    const { type, payload } = message

    switch (type) {
      case "CREATE_ROOM":
        this.createRoom(ws, playerId, payload)
        break
      case "JOIN_ROOM":
        this.joinRoom(ws, playerId, payload)
        break
      case "START_GAME":
        this.startGame(playerId, payload)
        break
      case "FLIP_CARD":
        this.flipCard(playerId, payload)
        break
      case "RESTART_GAME":
        this.restartGame(playerId)
        break
      case "LEAVE_ROOM":
        this.leaveRoom(playerId)
        break
      default:
        console.log(`❓ Unknown message type: ${type}`)
        this.sendError(ws, "Unknown message type")
    }
  }

  private createRoom(ws: WebSocket, playerId: string, payload: any) {
    const roomId = this.generateRoomId()
    const { playerName, playerColor, gameConfig, imagePackage } = payload

    const player: Player = {
      id: playerId,
      name: playerName,
      color: playerColor,
      score: 0,
      isHost: true,
      ws,
    }

    const room: GameRoom = {
      id: roomId,
      hostId: playerId,
      players: new Map([[playerId, player]]),
      gameState: {
        cards: [],
        currentPlayerIndex: 0,
        flippedCards: [],
        isGameStarted: false,
        isGameEnded: false,
        gameConfig,
        imagePackage,
      },
      createdAt: new Date(),
    }

    this.rooms.set(roomId, room)
    this.playerToRoom.set(playerId, roomId)

    console.log(`🏠 Room created: ${roomId} by ${playerName}`)

    this.sendToPlayer(playerId, {
      type: "ROOM_CREATED",
      payload: {
        roomId,
        joinUrl: `${process.env.CLIENT_URL || "http://localhost:3000"}?room=${roomId}`,
        player: this.sanitizePlayer(player),
      },
    })

    this.broadcastRoomUpdate(roomId)
  }

  private joinRoom(ws: WebSocket, playerId: string, payload: any) {
    const { roomId, playerName, playerColor } = payload
    const room = this.rooms.get(roomId)

    if (!room) {
      this.sendError(ws, "Room not found")
      return
    }

    if (room.gameState.isGameStarted) {
      this.sendError(ws, "Game already started")
      return
    }

    // Check for duplicate names
    const existingPlayer = Array.from(room.players.values()).find((p) => p.name === playerName)
    if (existingPlayer) {
      this.sendError(ws, "Player name already taken")
      return
    }

    const player: Player = {
      id: playerId,
      name: playerName,
      color: playerColor,
      score: 0,
      isHost: false,
      ws,
    }

    room.players.set(playerId, player)
    this.playerToRoom.set(playerId, roomId)

    console.log(`👥 Player ${playerName} joined room ${roomId}`)

    this.sendToPlayer(playerId, {
      type: "ROOM_JOINED",
      payload: {
        roomId,
        player: this.sanitizePlayer(player),
        gameState: this.sanitizeGameState(room.gameState),
      },
    })

    this.broadcastRoomUpdate(roomId)
  }

  private startGame(playerId: string, payload: any) {
    const roomId = this.playerToRoom.get(playerId)
    if (!roomId) return

    const room = this.rooms.get(roomId)
    if (!room || room.hostId !== playerId) {
      this.sendError(room?.players.get(playerId)?.ws, "Only host can start the game")
      return
    }

    // Initialize game cards
    const { gameConfig, imagePackage } = room.gameState
    const cards = this.initializeCards(imagePackage.images, gameConfig.pairs)

    room.gameState.cards = cards
    room.gameState.isGameStarted = true
    room.gameState.isGameEnded = false
    room.gameState.currentPlayerIndex = 0
    room.gameState.flippedCards = []

    // Reset player scores
    room.players.forEach((player) => {
      player.score = 0
    })

    console.log(`🎮 Game started in room ${roomId}`)

    this.broadcastToRoom(roomId, {
      type: "GAME_STARTED",
      payload: {
        gameState: this.sanitizeGameState(room.gameState),
        players: Array.from(room.players.values()).map(this.sanitizePlayer),
      },
    })
  }

  private flipCard(playerId: string, payload: any) {
    const roomId = this.playerToRoom.get(playerId)
    if (!roomId) return

    const room = this.rooms.get(roomId)
    if (!room || !room.gameState.isGameStarted) return

    const { cardId } = payload
    const players = Array.from(room.players.values())
    const currentPlayer = players[room.gameState.currentPlayerIndex]

    if (currentPlayer.id !== playerId) {
      this.sendError(room.players.get(playerId)?.ws, "Not your turn")
      return
    }

    const card = room.gameState.cards.find((c) => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched) return

    // Flip the card
    card.isFlipped = true
    room.gameState.flippedCards.push(cardId)

    this.broadcastToRoom(roomId, {
      type: "CARD_FLIPPED",
      payload: {
        cardId,
        playerId,
        gameState: this.sanitizeGameState(room.gameState),
      },
    })

    // Check for match after 2 cards are flipped
    if (room.gameState.flippedCards.length === 2) {
      setTimeout(() => {
        this.checkForMatch(roomId)
      }, 1500) // Give time for animation
    }
  }

  private checkForMatch(roomId: string) {
    const room = this.rooms.get(roomId)
    if (!room) return

    const flippedCards = room.gameState.cards.filter((c) => room.gameState.flippedCards.includes(c.id))

    if (flippedCards.length !== 2) return

    const [card1, card2] = flippedCards
    const isMatch = card1.imageUrl === card2.imageUrl

    if (isMatch) {
      // Mark cards as matched
      card1.isMatched = true
      card2.isMatched = true

      // Award points to current player
      const players = Array.from(room.players.values())
      const currentPlayer = players[room.gameState.currentPlayerIndex]
      currentPlayer.score += 1

      console.log(`✅ Match found in room ${roomId} by ${currentPlayer.name}`)

      this.broadcastToRoom(roomId, {
        type: "MATCH_FOUND",
        payload: {
          cardIds: [card1.id, card2.id],
          playerId: currentPlayer.id,
          score: currentPlayer.score,
          gameState: this.sanitizeGameState(room.gameState),
        },
      })

      // Check if game is complete
      const allMatched = room.gameState.cards.every((c) => c.isMatched)
      if (allMatched) {
        this.endGame(roomId)
        return
      }
    } else {
      // Flip cards back
      card1.isFlipped = false
      card2.isFlipped = false

      this.broadcastToRoom(roomId, {
        type: "NO_MATCH",
        payload: {
          cardIds: [card1.id, card2.id],
          gameState: this.sanitizeGameState(room.gameState),
        },
      })

      // Next player's turn
      room.gameState.currentPlayerIndex = (room.gameState.currentPlayerIndex + 1) % room.players.size
    }

    // Clear flipped cards
    room.gameState.flippedCards = []

    this.broadcastToRoom(roomId, {
      type: "TURN_CHANGED",
      payload: {
        currentPlayerIndex: room.gameState.currentPlayerIndex,
        gameState: this.sanitizeGameState(room.gameState),
      },
    })
  }

  private endGame(roomId: string) {
    const room = this.rooms.get(roomId)
    if (!room) return

    room.gameState.isGameEnded = true

    const players = Array.from(room.players.values())
    const sortedPlayers = players.sort((a, b) => b.score - a.score)

    console.log(`🏁 Game ended in room ${roomId}`)

    this.broadcastToRoom(roomId, {
      type: "GAME_ENDED",
      payload: {
        players: sortedPlayers.map(this.sanitizePlayer),
        winner: sortedPlayers[0] ? this.sanitizePlayer(sortedPlayers[0]) : null,
        gameState: this.sanitizeGameState(room.gameState),
      },
    })
  }

  private restartGame(playerId: string) {
    const roomId = this.playerToRoom.get(playerId)
    if (!roomId) return

    const room = this.rooms.get(roomId)
    if (!room || room.hostId !== playerId) return

    // Reset game state
    room.gameState.isGameStarted = false
    room.gameState.isGameEnded = false
    room.gameState.cards = []
    room.gameState.currentPlayerIndex = 0
    room.gameState.flippedCards = []

    // Reset player scores
    room.players.forEach((player) => {
      player.score = 0
    })

    console.log(`🔄 Game restarted in room ${roomId}`)

    this.broadcastToRoom(roomId, {
      type: "GAME_RESTARTED",
      payload: {
        gameState: this.sanitizeGameState(room.gameState),
        players: Array.from(room.players.values()).map(this.sanitizePlayer),
      },
    })
  }

  private leaveRoom(playerId: string) {
    const roomId = this.playerToRoom.get(playerId)
    if (!roomId) return

    const room = this.rooms.get(roomId)
    if (!room) return

    const player = room.players.get(playerId)
    if (!player) return

    room.players.delete(playerId)
    this.playerToRoom.delete(playerId)

    console.log(`👋 Player ${player.name} left room ${roomId}`)

    // If host left, assign new host or close room
    if (player.isHost) {
      if (room.players.size > 0) {
        const newHost = Array.from(room.players.values())[0]
        newHost.isHost = true
        room.hostId = newHost.id

        this.broadcastToRoom(roomId, {
          type: "NEW_HOST",
          payload: {
            newHostId: newHost.id,
            players: Array.from(room.players.values()).map(this.sanitizePlayer),
          },
        })
      } else {
        // Close empty room
        this.rooms.delete(roomId)
        console.log(`🏠 Room ${roomId} closed (empty)`)
        return
      }
    }

    this.broadcastRoomUpdate(roomId)
  }

  private handleDisconnection(playerId: string) {
    this.leaveRoom(playerId)
  }

  private initializeCards(images: any[], pairs: number): GameCard[] {
    const selectedImages = images.slice(0, pairs)
    const cards: GameCard[] = []

    selectedImages.forEach((image, index) => {
      // Create two cards for each image (pair)
      cards.push({
        id: `${index}-1`,
        imageUrl: image.url,
        isFlipped: false,
        isMatched: false,
        position: index * 2,
      })
      cards.push({
        id: `${index}-2`,
        imageUrl: image.url,
        isFlipped: false,
        isMatched: false,
        position: index * 2 + 1,
      })
    })

    // Shuffle cards
    return this.shuffleArray(cards).map((card, index) => ({
      ...card,
      position: index,
    }))
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  private broadcastToRoom(roomId: string, message: any) {
    const room = this.rooms.get(roomId)
    if (!room) return

    room.players.forEach((player) => {
      if (player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(message))
      }
    })
  }

  private broadcastRoomUpdate(roomId: string) {
    const room = this.rooms.get(roomId)
    if (!room) return

    const players = Array.from(room.players.values()).map(this.sanitizePlayer)

    this.broadcastToRoom(roomId, {
      type: "ROOM_UPDATED",
      payload: {
        players,
        gameState: this.sanitizeGameState(room.gameState),
      },
    })
  }

  private sendToPlayer(playerId: string, message: any) {
    const roomId = this.playerToRoom.get(playerId)
    if (!roomId) return

    const room = this.rooms.get(roomId)
    if (!room) return

    const player = room.players.get(playerId)
    if (player && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(message))
    }
  }

  private sendError(ws: WebSocket | undefined, error: string) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "ERROR",
          payload: { message: error },
        }),
      )
    }
  }

  private sanitizePlayer(player: Player) {
    return {
      id: player.id,
      name: player.name,
      color: player.color,
      score: player.score,
      isHost: player.isHost,
    }
  }

  private sanitizeGameState(gameState: any) {
    return {
      cards: gameState.cards.map((card: GameCard) => ({
        id: card.id,
        imageUrl: card.imageUrl,
        isFlipped: card.isFlipped,
        isMatched: card.isMatched,
        position: card.position,
      })),
      currentPlayerIndex: gameState.currentPlayerIndex,
      flippedCards: gameState.flippedCards,
      isGameStarted: gameState.isGameStarted,
      isGameEnded: gameState.isGameEnded,
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  private generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  private cleanupRooms() {
    const now = new Date()
    const maxAge = 2 * 60 * 60 * 1000 // 2 hours

    this.rooms.forEach((room, roomId) => {
      if (now.getTime() - room.createdAt.getTime() > maxAge) {
        console.log(`🧹 Cleaning up old room: ${roomId}`)

        // Notify players
        this.broadcastToRoom(roomId, {
          type: "ROOM_CLOSED",
          payload: { reason: "Room expired" },
        })

        // Remove room and player mappings
        room.players.forEach((player) => {
          this.playerToRoom.delete(player.id)
        })
        this.rooms.delete(roomId)
      }
    })
  }
}

// Start server
const port = process.env.WS_PORT ? Number.parseInt(process.env.WS_PORT) : 8080
new MemoryGameServer(port)
