import { Resend } from "resend"

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY)

// Email templates
const getInvitationEmailTemplate = (workspaceName: string, inviteUrl: string, inviterName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invitation to ${workspaceName}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9fafb;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .logo {
      max-height: 50px;
      margin-bottom: 15px;
    }
    .content {
      padding: 30px 20px;
    }
    .button {
      display: inline-block;
      background-color: #3b82f6;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #2563eb;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .highlight {
      font-weight: 600;
      color: #111827;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>You've Been Invited!</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p><span class="highlight">${inviterName}</span> has invited you to join <span class="highlight">${workspaceName}</span> on ProjectFlow.</p>
      <p>Join your team to start collaborating on projects, tasks, and more.</p>
      <div style="text-align: center;">
        <a href="${inviteUrl}" class="button">Accept Invitation</a>
      </div>
      <p>This invitation link will expire in 7 days.</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ProjectFlow. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`

const getWorkspaceAddedTemplate = (workspaceName: string, dashboardUrl: string, inviterName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Added to ${workspaceName}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f9fafb;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .logo {
      max-height: 50px;
      margin-bottom: 15px;
    }
    .content {
      padding: 30px 20px;
    }
    .button {
      display: inline-block;
      background-color: #3b82f6;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #2563eb;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .highlight {
      font-weight: 600;
      color: #111827;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>You've Been Added to a Workspace</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p><span class="highlight">${inviterName}</span> has added you to <span class="highlight">${workspaceName}</span> on ProjectFlow.</p>
      <p>You can now access this workspace and collaborate with your team.</p>
      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ProjectFlow. All rights reserved.</p>
      <p>This is an automated message, please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`

/**
 * Send an invitation email to a new user
 */
export async function sendInvitationEmail(
  email: string,
  workspaceName: string,
  inviteUrl: string,
  inviterName: string,
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    // Skip sending in development unless explicitly enabled
    if (process.env.NODE_ENV === "development" && process.env.ENABLE_EMAILS !== "true") {
      console.log("\n=== INVITATION EMAIL (DEVELOPMENT MODE) ===")
      console.log(`📧 TO: ${email}`)
      console.log(`📧 SUBJECT: Join ${workspaceName} on ProjectFlow`)
      console.log(`📧 INVITE URL: ${inviteUrl}`)
      console.log("=== EMAIL NOT SENT (DEVELOPMENT MODE) ===\n")
      return { success: true, messageId: "dev-mode-skipped" }
    }

    // Send the actual email
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: [email],
      subject: `Join ${workspaceName} on ProjectFlow`,
      html: getInvitationEmailTemplate(workspaceName, inviteUrl, inviterName),
    })

    if (error) {
      console.error("Failed to send invitation email:", error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (error: any) {
    console.error("Email service error:", error)
    return { success: false, error: error.message || "Unknown error sending email" }
  }
}

/**
 * Send a notification email to an existing user that they've been added to a workspace
 */
export async function sendWorkspaceAddedEmail(
  email: string,
  workspaceName: string,
  dashboardUrl: string,
  inviterName: string,
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    // Skip sending in development unless explicitly enabled
    if (process.env.NODE_ENV === "development" && process.env.ENABLE_EMAILS !== "true") {
      console.log("\n=== WORKSPACE ADDED EMAIL (DEVELOPMENT MODE) ===")
      console.log(`📧 TO: ${email}`)
      console.log(`📧 SUBJECT: You've been added to ${workspaceName}`)
      console.log(`📧 DASHBOARD URL: ${dashboardUrl}`)
      console.log("=== EMAIL NOT SENT (DEVELOPMENT MODE) ===\n")
      return { success: true, messageId: "dev-mode-skipped" }
    }

    // Send the actual email
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "ProjectFlow <noreply@projectflow.app>",
      to: [email],
      subject: `You've been added to ${workspaceName}`,
      html: getWorkspaceAddedTemplate(workspaceName, dashboardUrl, inviterName),
    })

    if (error) {
      console.error("Failed to send workspace added email:", error)
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (error: any) {
    console.error("Email service error:", error)
    return { success: false, error: error.message || "Unknown error sending email" }
  }
}
