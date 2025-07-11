import { initializeApp, getApps } from "firebase/app"
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from "firebase/storage"

// Firebase configuration (reusing from your existing config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

// Initialize Firebase (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firebase Storage
export const storage = getStorage(app)

// Firebase Storage Service Class
export class FirebaseStorageService {
  private static instance: FirebaseStorageService

  static getInstance(): FirebaseStorageService {
    if (!FirebaseStorageService.instance) {
      FirebaseStorageService.instance = new FirebaseStorageService()
    }
    return FirebaseStorageService.instance
  }

  /**
   * Generate a unique file path for storage
   */
  private generateFilePath(workspaceId: string, originalFileName: string): string {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substr(2, 9)
    const fileExtension = originalFileName.split(".").pop()
    const uniqueFileName = `${timestamp}_${randomString}.${fileExtension}`
    return `documents/${workspaceId}/${uniqueFileName}`
  }

  /**
   * Upload file to Firebase Storage
   */
  async uploadFile(
    file: File | Buffer,
    workspaceId: string,
    originalFileName: string,
    metadata?: { [key: string]: string },
  ): Promise<{
    downloadURL: string
    storagePath: string
    fileName: string
  }> {
    try {
      const storagePath = this.generateFilePath(workspaceId, originalFileName)
      const storageRef = ref(storage, storagePath)

      // Prepare metadata
      const uploadMetadata = {
        customMetadata: {
          originalFileName,
          workspaceId,
          uploadedAt: new Date().toISOString(),
          ...metadata,
        },
      }

      // Upload file
      let uploadResult
      if (file instanceof File) {
        uploadResult = await uploadBytes(storageRef, file, uploadMetadata)
      } else {
        // Buffer case (for server-side uploads)
        uploadResult = await uploadBytes(storageRef, file, uploadMetadata)
      }

      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref)

      return {
        downloadURL,
        storagePath,
        fileName: storagePath.split("/").pop() || originalFileName,
      }
    } catch (error) {
      console.error("Firebase Storage upload error:", error)
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Delete file from Firebase Storage
   */
  async deleteFile(storagePath: string): Promise<void> {
    try {
      const storageRef = ref(storage, storagePath)
      await deleteObject(storageRef)
      console.log(`File deleted successfully: ${storagePath}`)
    } catch (error) {
      console.error("Firebase Storage delete error:", error)
      // Don't throw error if file doesn't exist
      if (error instanceof Error && error.message.includes("object-not-found")) {
        console.warn(`File not found in storage: ${storagePath}`)
        return
      }
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(storagePath: string) {
    try {
      const storageRef = ref(storage, storagePath)
      return await getMetadata(storageRef)
    } catch (error) {
      console.error("Firebase Storage metadata error:", error)
      throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Get download URL for existing file
   */
  async getDownloadURL(storagePath: string): Promise<string> {
    try {
      const storageRef = ref(storage, storagePath)
      return await getDownloadURL(storageRef)
    } catch (error) {
      console.error("Firebase Storage download URL error:", error)
      throw new Error(`Failed to get download URL: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(storagePath: string): Promise<boolean> {
    try {
      const storageRef = ref(storage, storagePath)
      await getMetadata(storageRef)
      return true
    } catch (error) {
      return false
    }
  }
}

// Export singleton instance
export const firebaseStorageService = FirebaseStorageService.getInstance()
