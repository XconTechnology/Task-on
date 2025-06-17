"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"
import { documentApi } from "@/lib/api"
import type { Document } from "@/lib/types"
import Image from "next/image"

interface DocumentPreviewDialogProps {
  document: Document | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DocumentPreviewDialog({ document, open, onOpenChange }: DocumentPreviewDialogProps) {
  const [loading, setLoading] = useState(false)

  if (!document) return null

  const handleDownload = async () => {
    setLoading(true)
    try {
      await documentApi.downloadDocument(document.id, document.fileName)
    } catch (error) {
      console.error("Download failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPreviewContent = () => {
    // Use the actual file URL from the document instead of preview API
    const fileUrl = document.fileUrl

    // Image files
    if (document.fileType.startsWith("image/")) {
      return (
        <div className="flex justify-center items-center max-h-[70vh] overflow-hidden">
          <Image
            src={fileUrl || "/placeholder.svg"}
            alt={document.name}
            className="max-w-full max-h-full object-contain rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg?height=400&width=400"
            }}
          />
        </div>
      )
    }

    // PDF files
    if (document.fileType === "application/pdf") {
      return (
        <div className="w-full h-[70vh]">
          <iframe
            src={fileUrl}
            className="w-full h-full border rounded-lg"
            title={document.name}
            onError={() => {
              console.error("PDF preview failed")
            }}
          />
        </div>
      )
    }

    // Text files
    if (
      document.fileType.startsWith("text/") ||
      document.fileType === "application/json" ||
      document.fileName.endsWith(".md") ||
      document.fileName.endsWith(".txt")
    ) {
      return (
        <div className="w-full h-[70vh]">
          <iframe src={fileUrl} className="w-full h-full border rounded-lg bg-white" title={document.name} />
        </div>
      )
    }

    // Video files
    if (document.fileType.startsWith("video/")) {
      return (
        <div className="flex justify-center items-center">
          <video src={fileUrl} controls className="max-w-full max-h-[70vh] rounded-lg">
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    // Audio files
    if (document.fileType.startsWith("audio/")) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">🎵</div>
            <audio src={fileUrl} controls className="mb-4">
              Your browser does not support the audio tag.
            </audio>
            <p className="text-sm text-gray-600">{document.fileName}</p>
          </div>
        </div>
      )
    }

    // Archive files (zip, rar, etc.)
    if (
      document.fileType === "application/zip" ||
      document.fileType === "application/x-rar-compressed" ||
      document.fileName.endsWith(".zip") ||
      document.fileName.endsWith(".rar") ||
      document.fileName.endsWith(".7z")
    ) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium mb-2">Archive File</h3>
            <p className="text-sm text-gray-600 mb-4">{document.fileName}</p>
            <p className="text-xs text-gray-500">Archive files cannot be previewed. Click download to save the file.</p>
          </div>
        </div>
      )
    }

    // Office documents
    if (
      document.fileType.includes("word") ||
      document.fileType.includes("excel") ||
      document.fileType.includes("powerpoint") ||
      document.fileName.endsWith(".docx") ||
      document.fileName.endsWith(".xlsx") ||
      document.fileName.endsWith(".pptx")
    ) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="text-6xl mb-4">
              {document.fileType.includes("word") || document.fileName.endsWith(".docx")
                ? "📝"
                : document.fileType.includes("excel") || document.fileName.endsWith(".xlsx")
                  ? "📊"
                  : "📈"}
            </div>
            <h3 className="text-lg font-medium mb-2">Office Document</h3>
            <p className="text-sm text-gray-600 mb-4">{document.fileName}</p>
            <p className="text-xs text-gray-500">
              Office documents cannot be previewed in browser. Click download to open with appropriate software.
            </p>
          </div>
        </div>
      )
    }

    // Default fallback for unknown file types
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium mb-2">File Preview Not Available</h3>
          <p className="text-sm text-gray-600 mb-4">{document.fileName}</p>
          <p className="text-xs text-gray-500">This file type cannot be previewed. Click download to save the file.</p>
        </div>
      </div>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex-1 min-w-0">
            <DialogTitle className="truncate">{document.name}</DialogTitle>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span>{formatFileSize(document.fileSize)}</span>
              <span>{document.fileType}</span>
              {document.project && <span className="flex items-center gap-1">📁 {document.project.name}</span>}
              {document.task && <span className="flex items-center gap-1">✅ {document.task.title}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              {loading ? "Downloading..." : "Download"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.open(document.fileUrl, "_blank")}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="overflow-auto">{getPreviewContent()}</div>
      </DialogContent>
    </Dialog>
  )
}
