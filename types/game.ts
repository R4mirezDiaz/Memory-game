export interface GameImage {
  id: string
  url: string
  name: string
  type: "url" | "file"
  file?: File
}

export interface ImagePackage {
  id: string
  name: string
  description: string
  images: GameImage[]
  createdAt: Date
  updatedAt: Date
}

export interface GameConfig {
  pairs: number
  players: string[]
  selectedPackage: string
  difficulty: "easy" | "medium" | "hard"
}

export interface GameState {
  cards: Card[]
  currentPlayer: number
  scores: Record<string, number>
  flippedCards: number[]
  matchedPairs: string[]
  gameStatus: "setup" | "playing" | "finished"
  moves: number
  streaks: Record<string, number>
  bonusPoints: Record<string, number>
  timeBonus: Record<string, number>
  perfectMatches: Record<string, number>
}

export interface Card {
  id: string
  imageId: string
  imageUrl: string
  isFlipped: boolean
  isMatched: boolean
  position: number
}

export interface GameResult {
  id: string
  packageName: string
  packageId: string
  players: PlayerResult[]
  totalTime: number
  totalMoves: number
  difficulty: "easy" | "medium" | "hard"
  pairs: number
  completedAt: Date
}

export interface PlayerResult {
  name: string
  score: number
  matches: number
  bonusPoints: number
  timeBonus: number
  streak: number
  perfectMatches: number
  rank: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: (result: GameResult, playerResult: PlayerResult) => boolean
  rarity: "common" | "rare" | "epic" | "legendary"
}

export interface PlayerStats {
  totalGames: number
  totalWins: number
  totalMatches: number
  bestTime: number
  bestScore: number
  longestStreak: number
  achievements: string[]
  averageScore: number
  favoritePackage: string
}
