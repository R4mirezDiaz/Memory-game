"use client"

import { useState, useRef } from "react"
import { ArrowLeft, X, Upload, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ImagePackage, GameImage } from "@/types/game"
import { StorageManager } from "@/lib/storage"

interface PackageEditorProps {
  package?: ImagePackage | null
  onSave: (packageData: ImagePackage) => void
  onCancel: () => void
}

export function PackageEditor({ package: editPackage, onSave, onCancel }: PackageEditorProps) {
  const [name, setName] = useState(editPackage?.name || "")
  const [description, setDescription] = useState(editPackage?.description || "")
  const [images, setImages] = useState<GameImage[]>(editPackage?.images || [])
  const [urlInput, setUrlInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return

    const newImage: GameImage = {
      id: `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url: urlInput.trim(),
      name: `Imagen ${images.length + 1}`,
      type: "url",
    }

    setImages([...images, newImage])
    setUrlInput("")
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return

    setIsLoading(true)
    const newImages: GameImage[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.type.startsWith("image/")) {
        try {
          const fileId = await StorageManager.saveImageFile(file)
          const newImage: GameImage = {
            id: fileId,
            url: fileId,
            name: file.name,
            type: "file",
            file,
          }
          newImages.push(newImage)
        } catch (error) {
          console.error("Error uploading file:", error)
        }
      }
    }

    setImages([...images, ...newImages])
    setIsLoading(false)
  }

  const handleRemoveImage = (imageId: string) => {
    setImages(images.filter((img) => img.id !== imageId))
  }

  const handleSave = () => {
    if (!name.trim() || images.length < 2) return

    const packageData: ImagePackage = {
      id: editPackage?.id || `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      description: description.trim(),
      images,
      createdAt: editPackage?.createdAt || new Date(),
      updatedAt: new Date(),
    }

    onSave(packageData)
  }

  const getImagePreview = (image: GameImage) => {
    return StorageManager.getImageUrl(image.url, image.type)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-white/20 text-white hover:bg-white/10 bg-transparent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-white">{editPackage ? "Editar Paquete" : "Nuevo Paquete"}</h2>
          <p className="text-white/80">
            {editPackage ? "Modifica tu paquete de imágenes" : "Crea un nuevo paquete de imágenes"}
          </p>
        </div>
      </div>

      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Información del Paquete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-white">
              Nombre del Paquete
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Animales, Frutas, Colores..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-white">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe brevemente este paquete de imágenes"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Imágenes ({images.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="url" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10">
              <TabsTrigger value="url" className="text-white data-[state=active]:bg-white/20">
                Por URL
              </TabsTrigger>
              <TabsTrigger value="file" className="text-white data-[state=active]:bg-white/20">
                Subir Archivo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="url" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  onKeyPress={(e) => e.key === "Enter" && handleAddUrl()}
                />
                <Button onClick={handleAddUrl} disabled={!urlInput.trim()}>
                  <Link className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  {isLoading ? "Subiendo..." : "Seleccionar Archivos"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {images.length > 0 && (
            <div className="mt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square bg-white/10 rounded-lg overflow-hidden">
                      <img
                        src={getImagePreview(image) || "/placeholder.svg"}
                        alt={image.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/placeholder.svg?height=100&width=100&text=Error"
                        }}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(image.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    <p className="text-xs text-white/80 mt-1 truncate">{image.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {images.length < 2 && (
            <p className="text-yellow-300 text-sm mt-4">⚠ Necesitas al menos 2 imágenes para crear un paquete válido</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-white/20 text-white hover:bg-white/10 bg-transparent"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={!name.trim() || images.length < 2}
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          {editPackage ? "Guardar Cambios" : "Crear Paquete"}
        </Button>
      </div>
    </div>
  )
}
