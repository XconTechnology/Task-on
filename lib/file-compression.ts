/**
 * File Compression Service for optimizing uploads
 * Compresses images and optimizes file sizes for better performance
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeKB?: number
}

export class FileCompressionService {
  private static instance: FileCompressionService

  static getInstance(): FileCompressionService {
    if (!FileCompressionService.instance) {
      FileCompressionService.instance = new FileCompressionService()
    }
    return FileCompressionService.instance
  }

  /**
   * Compress an image file
   */
  async compressImage(
    file: File,
    options: CompressionOptions = {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.8,
      maxSizeKB: 2048, // 2MB max
    },
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img
          const maxWidth = options.maxWidth || 1920
          const maxHeight = options.maxHeight || 1080

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width *= ratio
            height *= ratio
          }

          // Set canvas dimensions
          canvas.width = width
          canvas.height = height

          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to compress image"))
                return
              }

              // Check if compressed size is acceptable
              const compressedSizeKB = blob.size / 1024
              const maxSizeKB = options.maxSizeKB || 2048

              if (compressedSizeKB > maxSizeKB && options.quality && options.quality > 0.1) {
                // Try with lower quality
                const newOptions = { ...options, quality: options.quality * 0.8 }
                this.compressImage(file, newOptions).then(resolve).catch(reject)
                return
              }

              // Create new file with compressed data
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })

              resolve(compressedFile)
            },
            file.type,
            options.quality || 0.8,
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Compress file based on type
   */
  async compressFile(file: File, options?: CompressionOptions): Promise<File> {
    // Only compress images for now
    if (file.type.startsWith("image/")) {
      try {
        const compressed = await this.compressImage(file, options)
        console.log(`Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressed.size / 1024).toFixed(1)}KB`)
        return compressed
      } catch (error) {
        console.warn("Image compression failed, using original:", error)
        return file
      }
    }

    // For non-images, return as-is (could add PDF compression, etc.)
    return file
  }

  /**
   * Check if file needs compression
   */
  shouldCompress(file: File, maxSizeKB = 2048): boolean {
    const fileSizeKB = file.size / 1024
    return fileSizeKB > maxSizeKB && file.type.startsWith("image/")
  }

  /**
   * Get file size in human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }
}

export const fileCompressionService = FileCompressionService.getInstance()
