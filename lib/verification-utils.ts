import { getDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"

export interface VerificationCode {
  id: string
  email: string
  code: string // This will be hashed
  type: "signup" | "signin"
  userData?: any // For signup, store user data temporarily
  attempts: number
  maxAttempts: number
  expiresAt: Date
  createdAt: Date
}

export function generateVerificationCode(): string {
  // Generate a 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function hashCode(code: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(code, salt)
}

export async function verifyCode(plainCode: string, hashedCode: string): Promise<boolean> {
  return bcrypt.compare(plainCode, hashedCode)
}

export async function storeVerificationCode(
  email: string,
  code: string,
  type: "signup" | "signin",
  userData?: any,
): Promise<string> {
  const db = await getDatabase()
  const verificationCollection = db.collection("verification_codes")

  // Delete any existing codes for this email and type
  await verificationCollection.deleteMany({ email: email.toLowerCase(), type })

  const hashedCode = await hashCode(code)
  const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const verificationDoc: VerificationCode = {
    id: verificationId,
    email: email.toLowerCase(),
    code: hashedCode,
    type,
    userData: userData || null,
    attempts: 0,
    maxAttempts: 5,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    createdAt: new Date(),
  }

  await verificationCollection.insertOne(verificationDoc)
  return verificationId
}

export async function getVerificationCode(email: string, type: "signup" | "signin"): Promise<VerificationCode | null> {
  const db = await getDatabase()
  const verificationCollection = db.collection("verification_codes")

  const verification = await verificationCollection.findOne({
    email: email.toLowerCase(),
    type,
    expiresAt: { $gt: new Date() },
  })

  return verification as VerificationCode | null
}

export async function incrementAttempts(email: string, type: "signup" | "signin"): Promise<void> {
  const db = await getDatabase()
  const verificationCollection = db.collection("verification_codes")

  await verificationCollection.updateOne({ email: email.toLowerCase(), type }, { $inc: { attempts: 1 } })
}

export async function deleteVerificationCode(email: string, type: "signup" | "signin"): Promise<void> {
  const db = await getDatabase()
  const verificationCollection = db.collection("verification_codes")

  await verificationCollection.deleteMany({ email: email.toLowerCase(), type })
}

export async function cleanupExpiredCodes(): Promise<void> {
  const db = await getDatabase()
  const verificationCollection = db.collection("verification_codes")

  await verificationCollection.deleteMany({
    expiresAt: { $lt: new Date() },
  })
}

// Rate limiting for resend functionality
const resendAttempts = new Map<string, { count: number; resetTime: number }>()

export function checkResendRateLimit(email: string): boolean {
  const key = `resend:${email.toLowerCase()}`
  const now = Date.now()
  const limit = 3 // 3 attempts
  const windowMs = 60 * 1000 // 1 minute

  const attempts = resendAttempts.get(key)

  if (!attempts) {
    resendAttempts.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (now > attempts.resetTime) {
    resendAttempts.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (attempts.count >= limit) {
    return false
  }

  attempts.count++
  return true
}
