import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { GameProvider } from "@/contexts/game-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { WebSocketProvider } from "@/contexts/websocket-context"

export const metadata: Metadata = {
  title: "Memorama Kids",
  description: "Juego de memoria para niños",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <ThemeProvider>
          <WebSocketProvider>
            <GameProvider>{children}</GameProvider>
          </WebSocketProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
