import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailVerificationData {
  email: string
  code: string
  username?: string
  type: "signup" | "signin"
}

export class EmailService {
  /**
   * Send verification code email
   */
  static async sendVerificationCode(data: EmailVerificationData): Promise<{ success: boolean; error?: string }> {
    try {
      const { email, code, username, type } = data

      const subject = type === "signup" ? "Verify your email address" : "Sign in verification code"

      const htmlContent = this.generateVerificationEmailHTML(code, username, type)
      const textContent = this.generateVerificationEmailText(code, username, type)

      const result = await resend.emails.send({
        from: "noreply@yourdomain.com", // Replace with your verified domain
        to: [email],
        subject,
        html: htmlContent,
        text: textContent,
      })

      if (result.error) {
        console.error("Resend error:", result.error)
        return { success: false, error: result.error.message }
      }

      console.log("Verification email sent successfully:", result.data?.id)
      return { success: true }
    } catch (error) {
      console.error("Email service error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email",
      }
    }
  }

  /**
   * Generate HTML email template
   */
  private static generateVerificationEmailHTML(
    code: string,
    username?: string,
    type: "signup" | "signin" = "signup",
  ): string {
    const greeting = username ? `Hi ${username}` : "Hello"
    const title = type === "signup" ? "Welcome! Verify your email" : "Sign in verification"
    const message =
      type === "signup"
        ? "Thank you for signing up! Please verify your email address to complete your registration."
        : "Please verify your identity to sign in to your account."

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 10px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .message {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 30px;
          }
          .code-container {
            background: #f3f4f6;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #1f2937;
            font-family: 'Courier New', monospace;
          }
          .code-label {
            font-size: 14px;
            color: #6b7280;
            margin-top: 10px;
          }
          .instructions {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .instructions h4 {
            margin: 0 0 8px 0;
            color: #1e40af;
            font-size: 16px;
          }
          .instructions p {
            margin: 0;
            color: #1e40af;
            font-size: 14px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .warning {
            background: #fef3cd;
            border: 1px solid #fbbf24;
            border-radius: 6px;
            padding: 12px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">ProjectManager</div>
            <h1 class="title">${title}</h1>
            <p class="message">${greeting}! ${message}</p>
          </div>

          <div class="code-container">
            <div class="code">${code}</div>
            <div class="code-label">Your verification code</div>
          </div>

          <div class="instructions">
            <h4>How to verify:</h4>
            <p>1. Return to the verification page in your browser</p>
            <p>2. Enter the 6-digit code above</p>
            <p>3. Click "Verify" to continue</p>
          </div>

          <div class="warning">
            <strong>Security Notice:</strong> This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
          </div>

          <div class="footer">
            <p>This email was sent to ${data.email}</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>&copy; 2024 ProjectManager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Generate plain text email
   */
  private static generateVerificationEmailText(
    code: string,
    username?: string,
    type: "signup" | "signin" = "signup",
  ): string {
    const greeting = username ? `Hi ${username}` : "Hello"
    const title = type === "signup" ? "Welcome! Verify your email" : "Sign in verification"
    const message =
      type === "signup"
        ? "Thank you for signing up! Please verify your email address to complete your registration."
        : "Please verify your identity to sign in to your account."

    return `
${title}

${greeting}! ${message}

Your verification code is: ${code}

How to verify:
1. Return to the verification page in your browser
2. Enter the 6-digit code above
3. Click "Verify" to continue

This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.

---
ProjectManager Team
    `.trim()
  }

  /**
   * Send welcome email after successful verification
   */
  static async sendWelcomeEmail(email: string, username: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await resend.emails.send({
        from: "noreply@yourdomain.com", // Replace with your verified domain
        to: [email],
        subject: "Welcome to ProjectManager!",
        html: this.generateWelcomeEmailHTML(username),
        text: this.generateWelcomeEmailText(username),
      })

      if (result.error) {
        console.error("Welcome email error:", result.error)
        return { success: false, error: result.error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Welcome email service error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send welcome email",
      }
    }
  }

  private static generateWelcomeEmailHTML(username: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ProjectManager!</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
            margin-bottom: 20px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .subtitle {
            font-size: 18px;
            color: #6b7280;
            margin-bottom: 30px;
          }
          .cta-button {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .features {
            margin: 30px 0;
          }
          .feature {
            margin: 15px 0;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🚀 ProjectManager</div>
            <h1 class="title">Welcome aboard, ${username}!</h1>
            <p class="subtitle">Your account has been successfully created and verified.</p>
          </div>

          <div class="features">
            <div class="feature">
              <h3>📋 Manage Projects</h3>
              <p>Create and organize your projects with ease</p>
            </div>
            <div class="feature">
              <h3>👥 Team Collaboration</h3>
              <p>Invite team members and work together seamlessly</p>
            </div>
            <div class="feature">
              <h3>⏱️ Time Tracking</h3>
              <p>Track time spent on tasks and projects</p>
            </div>
            <div class="feature">
              <h3>📊 Analytics</h3>
              <p>Get insights into your productivity and progress</p>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" class="cta-button">
              Get Started
            </a>
          </div>

          <div class="footer">
            <p>Need help? Check out our documentation or contact support.</p>
            <p>&copy; 2024 ProjectManager. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private static generateWelcomeEmailText(username: string): string {
    return `
Welcome aboard, ${username}!

Your ProjectManager account has been successfully created and verified.

What you can do now:
- Create and manage projects
- Invite team members
- Track time on tasks
- View analytics and insights

Get started: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard

Need help? Contact our support team.

---
ProjectManager Team
    `.trim()
  }
}

export default EmailService
