import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: [to],
      subject,
      html,
      text,
    })

    return { success: true, data }
  } catch (error) {
    console.error("Email sending error:", error)
    return { success: false, error }
  }
}

export function generateVerificationEmailTemplate(code: string, username: string, type: "signup" | "signin") {
  const title = type === "signup" ? "Welcome to ProjectFlow!" : "Sign In Verification"
  const message =
    type === "signup"
      ? "Thank you for joining ProjectFlow. Please verify your email address to complete your registration."
      : "Please verify your email address to sign in to your ProjectFlow account."

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 20px;
        }
        .title {
          color: #1a202c;
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 10px 0;
        }
        .subtitle {
          color: #718096;
          font-size: 16px;
          margin: 0;
        }
        .code-container {
          background: #f7fafc;
          border: 2px dashed #e2e8f0;
          border-radius: 8px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
        }
        .code {
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #2d3748;
          font-family: 'Courier New', monospace;
        }
        .code-label {
          color: #718096;
          font-size: 14px;
          margin-top: 10px;
        }
        .message {
          color: #4a5568;
          font-size: 16px;
          margin: 20px 0;
          text-align: center;
        }
        .warning {
          background: #fef5e7;
          border-left: 4px solid #f6ad55;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .warning-text {
          color: #744210;
          font-size: 14px;
          margin: 0;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #718096;
          font-size: 14px;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">PM</div>
          <h1 class="title">${title}</h1>
          <p class="subtitle">Hi ${username},</p>
        </div>

        <p class="message">${message}</p>

        <div class="code-container">
          <div class="code">${code}</div>
          <div class="code-label">Your verification code</div>
        </div>

        <div class="warning">
          <p class="warning-text">
            <strong>Important:</strong> This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
          </p>
        </div>

        <div class="footer">
          <p>
            Need help? <a href="mailto:support@yourdomain.com">Contact our support team</a>
          </p>
          <p>© 2024 ProjectFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
    ${title}
    
    Hi ${username},
    
    ${message}
    
    Your verification code is: ${code}
    
    This code will expire in 10 minutes.
    
    If you didn't request this verification, please ignore this email.
    
    Need help? Contact our support team at support@yourdomain.com
    
    © 2024 ProjectFlow. All rights reserved.
  `

  return { html, text }
}

export async function sendVerificationEmail(email: string, code: string, username: string, type: "signup" | "signin") {
  const { html, text } = generateVerificationEmailTemplate(code, username, type)

  const subject =
    type === "signup" ? "Welcome to ProjectFlow - Verify Your Email" : "ProjectFlow - Sign In Verification"

  return await sendEmail({
    to: email,
    subject,
    html,
    text,
  })
}

export async function sendWelcomeEmail(email: string, username: string) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ProjectFlow!</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 20px;
        }
        .title {
          color: #1a202c;
          font-size: 28px;
          font-weight: 600;
          margin: 0 0 10px 0;
        }
        .subtitle {
          color: #718096;
          font-size: 18px;
          margin: 0;
        }
        .content {
          color: #4a5568;
          font-size: 16px;
          margin: 30px 0;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 20px 0;
        }
        .features {
          background: #f7fafc;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
        }
        .feature {
          margin: 15px 0;
          display: flex;
          align-items: center;
        }
        .feature-icon {
          background: #667eea;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-size: 12px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #718096;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">PM</div>
          <h1 class="title">Welcome to ProjectFlow!</h1>
          <p class="subtitle">Hi ${username}, you're all set!</p>
        </div>

        <div class="content">
          <p>Congratulations! Your email has been verified and your ProjectFlow account is now active.</p>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard" class="cta-button">
              Get Started Now
            </a>
          </div>

          <div class="features">
            <h3 style="margin-top: 0; color: #2d3748;">What you can do with ProjectFlow:</h3>
            
            <div class="feature">
              <div class="feature-icon">✓</div>
              <div>Create and manage projects with ease</div>
            </div>
            
            <div class="feature">
              <div class="feature-icon">✓</div>
              <div>Collaborate with your team in real-time</div>
            </div>
            
            <div class="feature">
              <div class="feature-icon">✓</div>
              <div>Track progress and meet deadlines</div>
            </div>
            
            <div class="feature">
              <div class="feature-icon">✓</div>
              <div>Set and achieve your targets</div>
            </div>
          </div>

          <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
        </div>

        <div class="footer">
          <p>
            Need help? <a href="mailto:support@yourdomain.com">Contact our support team</a>
          </p>
          <p>© 2024 ProjectFlow. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
    Welcome to ProjectFlow!
    
    Hi ${username}, you're all set!
    
    Congratulations! Your email has been verified and your ProjectFlow account is now active.
    
    What you can do with ProjectFlow:
    ✓ Create and manage projects with ease
    ✓ Collaborate with your team in real-time
    ✓ Track progress and meet deadlines
    ✓ Set and achieve your targets
    
    Get started: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard
    
    If you have any questions or need help getting started, don't hesitate to reach out to our support team.
    
    Need help? Contact our support team at support@yourdomain.com
    
    © 2024 ProjectFlow. All rights reserved.
  `

  return await sendEmail({
    to: email,
    subject: "Welcome to ProjectFlow - You're All Set!",
    html,
    text,
  })
}
