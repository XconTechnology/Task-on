import crypto from "crypto"

export interface VerificationCode {
  id: string
  email: string
  code: string
  type: "signup" | "signin"
  expiresAt: Date
  attempts: number
  createdAt: Date
  userData?: {
    username?: string
    password?: string
    workspaceId?: string
  }
}

export class VerificationUtils {
  /**
   * Generate a 6-digit verification code
   */
  static generateCode(): string {
    return crypto.randomInt(100000, 999999).toString()
  }

  /**
   * Generate a unique verification ID
   */
  static generateVerificationId(): string {
    return `verify_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`
  }

  /**
   * Check if verification code is expired
   */
  static isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt
  }

  /**
   * Get expiration time (10 minutes from now)
   */
  static getExpirationTime(): Date {
    const now = new Date()
    return new Date(now.getTime() + 10 * 60 * 1000) // 10 minutes
  }

  /**
   * Validate verification code format
   */
  static isValidCodeFormat(code: string): boolean {
    return /^\d{6}$/.test(code)
  }

  /**
   * Check if too many attempts have been made
   */
  static hasExceededAttempts(attempts: number, maxAttempts = 5): boolean {
    return attempts >= maxAttempts
  }

  /**
   * Calculate time remaining until expiration
   */
  static getTimeRemaining(expiresAt: Date): { minutes: number; seconds: number } {
    const now = new Date()
    const diff = expiresAt.getTime() - now.getTime()

    if (diff <= 0) {
      return { minutes: 0, seconds: 0 }
    }

    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    return { minutes, seconds }
  }

  /**
   * Hash verification code for secure storage
   */
  static hashCode(code: string): string {
    return crypto.createHash("sha256").update(code).digest("hex")
  }

  /**
   * Verify hashed code
   */
  static verifyHashedCode(code: string, hashedCode: string): boolean {
    const inputHash = this.hashCode(code)
    return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(hashedCode))
  }

  /**
   * Generate rate limiting key for resend functionality
   */
  static getRateLimitKey(email: string, type: "signup" | "signin"): string {
    return `resend_${type}_${email}`
  }

  /**
   * Check if user can resend code (rate limiting)
   */
  static canResendCode(lastSentAt: Date, cooldownMinutes = 1): boolean {
    const now = new Date()
    const cooldownMs = cooldownMinutes * 60 * 1000
    return now.getTime() - lastSentAt.getTime() >= cooldownMs
  }
}

export default VerificationUtils
