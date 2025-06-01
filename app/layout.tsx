import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { UserProvider } from "@/lib/user-context"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ProjectFlow - Modern Project Management",
  description: "A lightweight, performance-focused project management tool built with Next.js",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  )
}
