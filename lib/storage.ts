import type { ImagePackage } from "@/types/game"

const STORAGE_KEY = "memorama-packages"
const FILES_KEY = "memorama-files"

export class StorageManager {
  static getPackages(): ImagePackage[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  static savePackages(packages: ImagePackage[]): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(packages))
    } catch (error) {
      console.error("Error saving packages:", error)
    }
  }

  static async saveImageFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        try {
          const base64 = reader.result as string
          const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

          const storedFiles = this.getStoredFiles()
          storedFiles[fileId] = {
            name: file.name,
            type: file.type,
            data: base64,
            size: file.size,
          }

          localStorage.setItem(FILES_KEY, JSON.stringify(storedFiles))
          resolve(fileId)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  static getImageUrl(imageId: string, type: "url" | "file"): string {
    if (type === "url") return imageId

    const storedFiles = this.getStoredFiles()
    const file = storedFiles[imageId]
    return file ? file.data : "/placeholder.svg?height=100&width=100"
  }

  private static getStoredFiles(): Record<string, any> {
    if (typeof window === "undefined") return {}

    try {
      const stored = localStorage.getItem(FILES_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }
}
