"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Upload, X, Download, Eye, FileText, ImageIcon, File, Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { taskAttachmentApi } from "@/lib/api"
import { fileCompressionService } from "@/lib/file-compression"
import { useUser } from "@/lib/user-context"
import type { TaskAttachment } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"

interface TaskAttachmentsProps {
  taskId: string
  workspaceId: string
  canUpload?: boolean
}

export default function TaskAttachments({ taskId, canUpload = true }: TaskAttachmentsProps) {
  const { user } = useUser()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadForm, setUploadForm] = useState({
    name: "",
    description: "",
  })

  useEffect(() => {
    loadAttachments()
  }, [taskId])

  const loadAttachments = async () => {
    try {
      setLoading(true)
      const response = await taskAttachmentApi.getTaskAttachments(taskId)
      if (response.success && response.data) {
        setAttachments(response.data)
      }
    } catch (error) {
      console.error("Failed to load attachments:", error)
      toast({
        title: "Error",
        description: "Failed to load attachments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 50MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    setUploadForm((prev) => ({
      ...prev,
      name: prev.name || file.name,
    }))
  }

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.name.trim()) return

    setUploading(true)

    try {
      // Compress file if needed
      let fileToUpload = selectedFile
      if (fileCompressionService.shouldCompress(selectedFile)) {
        toast({
          title: "Optimizing file...",
          description: "Compressing image for better performance",
        })
        fileToUpload = await fileCompressionService.compressFile(selectedFile)
      }

      const formData = new FormData()
      formData.append("file", fileToUpload)
      formData.append("name", uploadForm.name.trim())
      formData.append("description", uploadForm.description.trim())
      // Note: taskId is now passed as a parameter to the API function

      // FIXED: Pass taskId as the first parameter
      const response = await taskAttachmentApi.createAttachment(taskId, formData)

      if (response.success) {
        toast({
          title: "Success",
          description: "Attachment uploaded successfully",
        })
        await loadAttachments()
        handleCloseUploadDialog()
      } else {
        throw new Error(response.error || "Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload attachment",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (attachmentId: string) => {
    try {
      const response = await taskAttachmentApi.deleteAttachment(attachmentId)
      if (response.success) {
        toast({
          title: "Success",
          description: "Attachment deleted successfully",
        })
        await loadAttachments()
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Delete failed",
        description: "Failed to delete attachment",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (attachment: TaskAttachment) => {
    try {
      await taskAttachmentApi.downloadAttachment(attachment.id, attachment.fileName)
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: "Failed to download attachment",
        variant: "destructive",
      })
    }
  }

  const handleCloseUploadDialog = () => {
    setShowUploadDialog(false)
    setSelectedFile(null)
    setUploadForm({ name: "", description: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="w-4 h-4" />
    if (fileType.includes("pdf")) return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const isImage = (fileType: string) => fileType.startsWith("image/")

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-gray-600">Loading attachments...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h4 className="font-medium text-gray-900">Attachments</h4>
          {attachments.length > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {attachments.length}
            </Badge>
          )}
        </div>
        {canUpload && (
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-1" />
                Add Attachment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Attachment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* File Upload */}
                <div className="space-y-2">
                  {!selectedFile ? (
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">Max file size: 50MB</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(selectedFile.type)}
                          <div>
                            <p className="text-sm font-medium">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {fileCompressionService.formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" accept="*/*" />
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter attachment name"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleCloseUploadDialog}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || !uploadForm.name.trim() || uploading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Attachments Grid */}
      {attachments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <File className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No attachments yet</p>
          {canUpload && <p className="text-xs">Upload files to share your work</p>}
        </div>
      ) : (
        <ScrollArea className="max-h-96">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attachments.map((attachment) => (
              <Card key={attachment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="space-y-3">
                    {/* Preview/Icon */}
                    <div className="relative">
                      {isImage(attachment.fileType) ? (
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={attachment.thumbnailUrl || attachment.fileUrl}
                            alt={attachment.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                          {getFileIcon(attachment.fileType)}
                          <span className="ml-2 text-sm text-gray-600 truncate">{attachment.fileName}</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <div>
                        <h5 className="font-medium text-sm truncate" title={attachment.name}>
                          {attachment.name}
                        </h5>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center justify-between text-small text-gray-500">
                        <span>{fileCompressionService.formatFileSize(attachment.fileSize)}</span>
                        <span>{formatDistanceToNow(new Date(attachment.createdAt), { addSuffix: true })}</span>
                      </div>

                      {/* Uploader */}
                      {attachment.uploader && (
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={attachment.uploader.profilePictureUrl || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">
                              {attachment.uploader.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-600">{attachment.uploader.username}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(attachment.fileUrl, "_blank")}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Preview</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownload(attachment)}
                                className="h-8 w-8 p-0"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {/* Delete button - only for uploader or admin */}
                      {(attachment.uploadedBy === user?.id || canUpload) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(attachment.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
