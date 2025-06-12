import { initializeApp, getApps } from "firebase/app"
import { getFirestore, enableNetwork, disableNetwork } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firestore with optimizations
export const db = getFirestore(app)

// Connection management class
class FirebaseConnectionManager {
  private isConnected = false
  private connectionPromise: Promise<void> | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null

  async ensureConnection(): Promise<void> {
    if (this.isConnected) {
      return Promise.resolve()
    }

    if (this.connectionPromise) {
      return this.connectionPromise
    }

    this.connectionPromise = this.connect()
    return this.connectionPromise
  }

  private async connect(): Promise<void> {
    try {
      await enableNetwork(db)
      this.isConnected = true
      this.connectionPromise = null
      console.log("Firebase connection established")
    } catch (error) {
      console.error("Firebase connection failed:", error)
      this.isConnected = false
      this.connectionPromise = null

      // Retry connection after 2 seconds
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout)
      }

      this.reconnectTimeout = setTimeout(() => {
        this.ensureConnection()
      }, 2000)

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
    } catch (error) {
      console.error("Firebase disconnect failed:", error)
    }
  }

  isConnectionActive(): boolean {
    return this.isConnected
  }
}

// Export singleton connection manager
export const firebaseConnectionManager = new FirebaseConnectionManager()

// Pre-warm connection on module load
if (typeof window !== "undefined") {
  // Only in browser environment
  firebaseConnectionManager.ensureConnection().catch(console.error)
}
