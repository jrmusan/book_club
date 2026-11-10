/** How long a sign-in link stays valid. Auth.js stores only a hash of the token. */
export const MAGIC_LINK_MAX_AGE_SECONDS = 60 * 60;

function expiryLabel(seconds: number) {
  if (seconds % 3600 === 0) {
    const hours = seconds / 3600;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Send a one-time sign-in link through the Resend HTTP API.
 * The link points at this app's Auth.js callback, which verifies the token.
 */
export async function sendResendSignInEmail(params: {
  identifier: string;
  url: string;
  expiresInSeconds?: number;
  provider: { apiKey?: string; from?: string };
}) {
  const apiKey = params.provider.apiKey?.trim() || process.env.RESEND_API_KEY?.trim();
  const from = params.provider.from?.trim() || process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not set");
  }

  const host = new URL(params.url).host;
  const expires = expiryLabel(params.expiresInSeconds ?? MAGIC_LINK_MAX_AGE_SECONDS);
  const safeUrl = escapeHtml(params.url);
  const safeHost = escapeHtml(host);
  const subject = `Sign in to ${host}`;
  const text = [
    `Sign in to ${host}`,
    ``,
    params.url,
    ``,
    `This link expires in ${expires} and works once.`,
    `If you did not ask to sign in, you can ignore this email.`,
  ].join("\n");
  const html = `<!DOCTYPE html>
<html>
  <body style="font-family: Georgia, serif; color: #1c1917; line-height: 1.5;">
    <p>Sign in to <strong>${safeHost}</strong></p>
    <p><a href="${safeUrl}">Open the sign-in link</a></p>
    <p style="color: #57534e;">This link expires in ${escapeHtml(expires)} and works once. If you did not ask to sign in, you can ignore this email.</p>
  </body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.identifier],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend rejected the sign-in email (${res.status}): ${body}`);
  }
}
