export interface SavedPlayer {
  id: string
  name: string
  color: string
}

const STORAGE_KEY = "memorama-saved-players"

export function getSavedPlayers(): SavedPlayer[] {
  if (typeof window === "undefined") return []

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function savePlayers(players: SavedPlayer[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
  } catch (error) {
    console.error("Error saving players:", error)
  }
}

export function addPlayer(player: Omit<SavedPlayer, "id">): SavedPlayer {
  const players = getSavedPlayers()

  // Check if player with same name and color already exists
  const existingPlayer = players.find(
    (p) => p.name.toLowerCase() === player.name.toLowerCase() && p.color === player.color,
  )

  if (existingPlayer) {
    return existingPlayer // Return existing player instead of creating duplicate
  }

  const newPlayer: SavedPlayer = {
    ...player,
    id: Date.now().toString(),
  }

  const updatedPlayers = [...players, newPlayer]
  savePlayers(updatedPlayers)

  return newPlayer
}

export function removePlayer(playerId: string): void {
  const players = getSavedPlayers()
  const updatedPlayers = players.filter((p) => p.id !== playerId)
  savePlayers(updatedPlayers)
}

export const deletePlayer = removePlayer

export function savePlayer(player: Omit<SavedPlayer, "id">): SavedPlayer {
  return addPlayer(player) // This now handles duplicates
}

export function updatePlayer(playerId: string, updates: Partial<Omit<SavedPlayer, "id">>): void {
  const players = getSavedPlayers()
  const updatedPlayers = players.map((p) => (p.id === playerId ? { ...p, ...updates } : p))
  savePlayers(updatedPlayers)
}

export const PLAYER_COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
]
