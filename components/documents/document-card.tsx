"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Download, MoreHorizontal, Edit, Trash2, Calendar, User, Folder, CheckSquare } from "lucide-react"
import type { Document } from "@/lib/types"
import { DocumentPreviewDialog } from "./document-preview-dialog"
import { documentApi } from "@/lib/api"

interface DocumentCardProps {
  document: Document
  onEdit: (document: Document) => void
  onDelete: (documentId: string) => void
}

export function DocumentCard({ document, onEdit, onDelete }: DocumentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄"
    if (fileType.includes("image")) return "🖼️"
    if (fileType.includes("video")) return "🎥"
    if (fileType.includes("audio")) return "🎵"
    if (fileType.includes("zip") || fileType.includes("rar")) return "📦"
    if (fileType.includes("word")) return "📝"
    if (fileType.includes("excel")) return "📊"
    if (fileType.includes("powerpoint")) return "📈"
    return "📄"
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await documentApi.downloadDocument(document.id, document.fileName)
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const handleDelete = () => {
    onDelete(document.id)
    setShowDeleteDialog(false)
  }

  const handleCardClick = () => {
    setShowPreviewDialog(true)
  }

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={handleCardClick}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="text-2xl flex-shrink-0">{getFileIcon(document.fileType)}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate text-gray-900">{document.name}</h3>
                <p className="text-xs text-gray-500 truncate">{document.fileName}</p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(document)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteDialog(true)
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {document.description && <p className="text-xs text-gray-600 mb-3 line-clamp-2">{document.description}</p>}

          <div className="flex flex-wrap gap-1 mb-3">
            {document.project && (
              <Badge variant="secondary" className="text-xs">
                <Folder className="h-3 w-3 mr-1" />
                {document.project.name}
              </Badge>
            )}
            {document.task && (
              <Badge variant="outline" className="text-xs">
                <CheckSquare className="h-3 w-3 mr-1" />
                {document.task.title}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>{formatFileSize(document.fileSize)}</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(document.createdAt)}
              </div>
            </div>
            {document.uploader && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {document.uploader.username}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{document.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DocumentPreviewDialog document={document} open={showPreviewDialog} onOpenChange={setShowPreviewDialog} />
    </>
  )
}
