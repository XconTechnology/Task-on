import { initializeApp, getApps } from "firebase/app"
import {
  getFirestore,
  enableNetwork,
  disableNetwork
} from "firebase/firestore"

// Safety check for required env variables


// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!
}

// Initialize Firebase (singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firestore
export const db = getFirestore(app)

// Connection management class
class FirebaseConnectionManager {
  private isConnected = false
  private connectionPromise: Promise<void> | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private retryAttempts = 0
  private readonly maxRetries = 5

  async ensureConnection(): Promise<void> {
    if (this.isConnected) return Promise.resolve()

    if (this.connectionPromise) return this.connectionPromise

    this.connectionPromise = this.connect()
    return this.connectionPromise
  }

  private async connect(): Promise<void> {
    try {
      await enableNetwork(db)
      this.isConnected = true
      this.retryAttempts = 0
      this.connectionPromise = null
      console.log("✅ Firebase connection established")
    } catch (error) {
      console.error("❌ Firebase connection failed:", error)
      this.isConnected = false
      this.connectionPromise = null

      // Retry with exponential backoff
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++
        const delay = Math.pow(2, this.retryAttempts) * 1000 // 2s, 4s, 8s, 16s, ...
        console.log(`🔄 Retrying Firebase connection in ${delay / 1000}s...`)

        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout)

        this.reconnectTimeout = setTimeout(() => {
          this.ensureConnection().catch(console.error)
        }, delay)
      } else {
        console.warn("⚠️ Max Firebase retry attempts reached.")
      }

      throw error
    }
  }

  async disconnect(): Promise<void> {
    try {
      await disableNetwork(db)
      this.isConnected = false
      this.connectionPromise = null

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
        this.reconnectTimeout = null
      }

      console.log("🛑 Firebase disconnected")
    } catch (error) {
      console.error("❌ Firebase disconnect failed:", error)
    }
  }

  isConnectionActive(): boolean {
    return this.isConnected
  }
}

// Export singleton connection manager
export const firebaseConnectionManager = new FirebaseConnectionManager()

// Client-side only: pre-warm connection + cleanup
if (typeof window !== "undefined") {
  firebaseConnectionManager.ensureConnection().catch(console.error)

  // Optional: disconnect when tab is closed
  window.addEventListener("beforeunload", () => {
    firebaseConnectionManager.disconnect()
  })
}
