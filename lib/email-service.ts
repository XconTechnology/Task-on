import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInvitationEmail(
  email: string,
  workspaceName: string,
  inviteUrl: string,
  inviterName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (process.env.ENABLE_EMAILS !== "true") {
      console.log("Emails disabled, would send invitation to:", email)
      return { success: true }
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "ProjectFlow <noreply@projectflow.com>",
      to: [email],
      subject: `You're invited to join ${workspaceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You're invited to join ${workspaceName}</h2>
          <p>Hi there!</p>
          <p>${inviterName} has invited you to join the <strong>${workspaceName}</strong> workspace on ProjectFlow.</p>
          <p>Click the button below to accept the invitation and create your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Accept Invitation
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6366f1;">${inviteUrl}</p>
          <p>This invitation will expire in 7 days.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error("Email sending error:", error)
      return { success: false, error: error.message }
    }

    console.log("Invitation email sent successfully:", data?.id)
    return { success: true }
  } catch (error) {
    console.error("Email service error:", error)
    return { success: false, error: "Failed to send email" }
  }
}

export async function sendWorkspaceInvitationEmail(
  email: string,
  workspaceName: string,
  inviteUrl: string,
  inviterName: string,
  isExistingUser = false,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (process.env.ENABLE_EMAILS !== "true") {
      console.log("Emails disabled, would send workspace invitation to:", email)
      return { success: true }
    }

    const subject = isExistingUser ? `Invitation to join ${workspaceName}` : `You're invited to join ${workspaceName}`

    const content = isExistingUser
      ? `
        <p>Hi there!</p>
        <p>${inviterName} has invited you to join the <strong>${workspaceName}</strong> workspace on ProjectFlow.</p>
        <p>You can accept this invitation from your inbox in the app, or click the button below:</p>
      `
      : `
        <p>Hi there!</p>
        <p>${inviterName} has invited you to join the <strong>${workspaceName}</strong> workspace on ProjectFlow.</p>
        <p>Click the button below to accept the invitation and create your account:</p>
      `

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "ProjectFlow <noreply@projectflow.com>",
      to: [email],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Workspace Invitation</h2>
          ${content}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              ${isExistingUser ? "View Invitation" : "Accept Invitation"}
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6366f1;">${inviteUrl}</p>
          <p>This invitation will expire in 7 days.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error("Email sending error:", error)
      return { success: false, error: error.message }
    }

    console.log("Workspace invitation email sent successfully:", data?.id)
    return { success: true }
  } catch (error) {
    console.error("Email service error:", error)
    return { success: false, error: "Failed to send email" }
  }
}

export async function sendWorkspaceAddedEmail(
  email: string,
  workspaceName: string,
  dashboardUrl: string,
  addedByName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (process.env.ENABLE_EMAILS !== "true") {
      console.log("Emails disabled, would send workspace added notification to:", email)
      return { success: true }
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "ProjectFlow <noreply@projectflow.com>",
      to: [email],
      subject: `You've been added to ${workspaceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been added to a workspace</h2>
          <p>Hi there!</p>
          <p>${addedByName} has added you to the <strong>${workspaceName}</strong> workspace on ProjectFlow.</p>
          <p>You can now access this workspace from your dashboard:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6366f1;">${dashboardUrl}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Welcome to the team!
          </p>
        </div>
      `,
    })

    if (error) {
      console.error("Email sending error:", error)
      return { success: false, error: error.message }
    }

    console.log("Workspace added email sent successfully:", data?.id)
    return { success: true }
  } catch (error) {
    console.error("Email service error:", error)
    return { success: false, error: "Failed to send email" }
  }
}
