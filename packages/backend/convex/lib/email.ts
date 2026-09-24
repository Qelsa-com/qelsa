/**
 * Unified email sender utility.
 * Sends emails via Cloudflare Email Service (REST API or Worker binding),
 * with fallback to Resend or clean local development console logging.
 */

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/** Cloudflare Email Sending REST objects use `address`, not `email`. */
function parseEmailAddress(raw: string): { address: string; name?: string } {
  const match = raw.match(/^(.*?)\s*<(.+)>$/);
  if (match) {
    const name = match[1].trim().replace(/^["']|["']$/g, "");
    return { name: name || undefined, address: match[2].trim() };
  }
  return { address: raw.trim() };
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = process.env.CLOUDFLARE_EMAIL_FROM || process.env.EMAIL_FROM || "Qelsa <no-reply@qelsa.com>",
}: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const rawRecipients = Array.isArray(to) ? to : [to];
  const parsedRecipients = rawRecipients.map(parseEmailAddress);
  const fromObj = parseEmailAddress(from);
  const plainText = text ?? html.replace(/<[^>]*>?/gm, "").trim();
  const recipientList = parsedRecipients.map((r) => r.address).join(", ");

  // 1. Cloudflare Email Service REST API
  // https://developers.cloudflare.com/email-service/api/send-emails/rest-api/
  const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const cfApiToken = process.env.CLOUDFLARE_EMAIL_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;

  if (cfAccountId && cfApiToken) {
    try {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/email/sending/send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cfApiToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromObj,
            to: parsedRecipients,
            subject,
            html,
            text: plainText,
          }),
        },
      );

      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        errors?: Array<{ message?: string }>;
        result?: { message_id?: string };
      } | null;

      if (res.ok && data?.success !== false) {
        console.log(`[Email] Sent via Cloudflare Email Sending to ${recipientList}`);
        return { success: true, id: data?.result?.message_id ?? "cf-sent" };
      }

      const errorText = data?.errors?.map((e) => e.message).filter(Boolean).join("; ") || `HTTP ${res.status}`;
      console.error("[Email] Cloudflare Email Service error:", errorText);
    } catch (err) {
      console.error("[Email] Error dispatching email via Cloudflare:", err);
    }
  }

  // 2. Cloudflare Worker Email Service endpoint (if using a Cloudflare Worker microservice)
  const cfWorkerUrl = process.env.CLOUDFLARE_EMAIL_WORKER_URL;
  if (cfWorkerUrl) {
    try {
      const res = await fetch(cfWorkerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.CLOUDFLARE_EMAIL_WORKER_SECRET
            ? { Authorization: `Bearer ${process.env.CLOUDFLARE_EMAIL_WORKER_SECRET}` }
            : {}),
        },
        body: JSON.stringify({
          from: fromObj,
          to: parsedRecipients,
          subject,
          html,
          text: plainText,
        }),
      });

      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { id?: string };
        console.log(`[Email] Sent via Cloudflare Worker to ${recipientList}`);
        return { success: true, id: data.id ?? "cf-worker-sent" };
      }

      console.error("[Email] Cloudflare Worker email dispatch error:", await res.text());
    } catch (err) {
      console.error("[Email] Error dispatching email via Cloudflare Worker:", err);
    }
  }

  // 3. Fallback: Resend (if RESEND_API_KEY is configured)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: rawRecipients,
          subject,
          html,
          text: plainText,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("[Email] Resend error:", errorText);
        return { success: false, error: errorText };
      }

      const data = (await res.json()) as { id: string };
      console.log(`[Email] Sent successfully via Resend to ${rawRecipients.join(", ")} (id: ${data.id})`);
      return { success: true, id: data.id };
    } catch (err) {
      console.error("[Email] Error dispatching email via Resend:", err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // 4. Local development / anonymous testing fallback
  console.log(`\n================= [EMAIL DISPATCH] =================`);
  console.log(`To: ${rawRecipients.join(", ")}`);
  console.log(`From: ${from}`);
  console.log(`Subject: ${subject}`);
  console.log(`-----------------------------------------------------`);
  console.log(text ?? html.replace(/<[^>]*>?/gm, "").trim());
  console.log(`=====================================================\n`);

  return { success: true, id: "dev-simulated-id" };
}

export async function sendPageInviteEmail({
  to,
  pageName,
  role,
  inviterName,
  inviteUrl,
}: {
  to: string;
  pageName: string;
  role: string;
  inviterName: string;
  inviteUrl: string;
}) {
  const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);
  const subject = `You've been invited to join ${pageName} on Qelsa`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0b14; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="540" style="max-width: 540px; background-color: #121220; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <span style="font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); -webkit-background-clip: text; -webkit-text-fill-color: #00f2fe;">
                Qelsa
              </span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="font-size: 16px; line-height: 24px; color: #e2e8f0; padding-bottom: 20px;">
              Hello,
            </td>
          </tr>
          <tr>
            <td style="font-size: 16px; line-height: 24px; color: #e2e8f0; padding-bottom: 24px;">
              <strong style="color: #ffffff;">${inviterName}</strong> has invited you to join the team for <strong style="color: #00f2fe;">${pageName}</strong> on Qelsa as an <strong style="color: #ffffff;">${roleDisplay}</strong>.
            </td>
          </tr>
          <tr>
            <td style="font-size: 14px; line-height: 22px; color: #94a3b8; padding-bottom: 32px;">
              As an ${roleDisplay}, you will be able to collaborate, manage company updates, and access the employer dashboard.
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <a href="${inviteUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 50px; box-shadow: 0 4px 15px rgba(0, 198, 255, 0.35);">
                Accept Invitation & Sign In
              </a>
            </td>
          </tr>

          <!-- Link fallback -->
          <tr>
            <td style="font-size: 12px; line-height: 18px; color: #64748b; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
              If the button doesn't work, copy and paste this link into your browser:<br/>
              <a href="${inviteUrl}" style="color: #00f2fe; word-break: break-all; text-decoration: underline;">
                ${inviteUrl}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return await sendEmail({
    to,
    subject,
    html,
    text: `${inviterName} has invited you to join ${pageName} on Qelsa as an ${roleDisplay}. Sign in or accept your invite at: ${inviteUrl}`,
  });
}

export async function sendOTPEmail({
  to,
  otp,
}: {
  to: string;
  otp: string;
}) {
  const subject = `${otp} is your Qelsa verification code`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0b14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0b14; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="500" style="max-width: 500px; background-color: #121220; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); text-align: center;">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <span style="font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%); -webkit-background-clip: text; -webkit-text-fill-color: #00f2fe;">
                Qelsa
              </span>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="font-size: 20px; font-weight: 700; color: #ffffff; padding-bottom: 12px;">
              Verification Code
            </td>
          </tr>
          <tr>
            <td style="font-size: 14px; line-height: 22px; color: #94a3b8; padding-bottom: 28px;">
              Use the one-time code below to complete your sign in. This code is valid for 10 minutes.
            </td>
          </tr>

          <!-- OTP Code Box -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <div style="display: inline-block; background-color: rgba(0, 242, 254, 0.08); border: 1px solid rgba(0, 242, 254, 0.35); border-radius: 12px; padding: 18px 36px;">
                <span style="font-family: monospace, Courier, monospace; font-size: 34px; font-weight: 700; letter-spacing: 10px; color: #00f2fe;">
                  ${otp}
                </span>
              </div>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="font-size: 13px; line-height: 20px; color: #64748b; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
              If you didn&apos;t request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const result = await sendEmail({
    to,
    subject,
    html,
    text: `Your Qelsa verification code is ${otp}. It will expire in 10 minutes.`,
  });
  if (!result.success) {
    throw new Error(result.error ?? "Failed to send verification email");
  }
  return result;
}

