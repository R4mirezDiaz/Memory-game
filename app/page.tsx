import { ImagePackageManager } from "@/components/image-package-manager"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="container mx-auto max-w-4xl">
        <ImagePackageManager />
      </div>
    </main>
  )
}
