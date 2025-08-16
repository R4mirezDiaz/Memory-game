export interface Player {
  id: string
  name: string
  color: string
  isHost: boolean
  score: number
}

export interface GameRoom {
  id: string
  hostId: string
  players: Player[]
  gameState: "waiting" | "playing" | "finished"
  currentTurn: string
  gameConfig?: any
  imagePackage?: any
}

export interface WebSocketMessage {
  type:
    | "join_room"
    | "player_joined"
    | "player_left"
    | "game_start"
    | "game_state"
    | "card_flip"
    | "turn_change"
    | "game_end"
    | "error"
  payload: any
  roomId?: string
  playerId?: string
}

export interface CardFlipMessage {
  cardId: string
  playerId: string
  isFlipped: boolean
}

export interface GameStateMessage {
  cards: any[]
  currentTurn: string
  scores: Record<string, number>
  gameStatus: "playing" | "finished"
}
