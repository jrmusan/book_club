import { escapeHtml } from "@/lib/email/escape-html";

export type SignInEmailContent = {
  signInUrl: string;
  host: string;
  expiresLabel: string;
};

/** Subject line for magic-link sign-in. */
export function signInEmailSubject(host: string) {
  return `Your Book Club sign-in link · ${host}`;
}

/** Plain-text fallback for clients that do not render HTML. */
export function signInEmailText({ signInUrl, host, expiresLabel }: SignInEmailContent) {
  return [
    "Book Club",
    "",
    `Sign in to ${host}`,
    "",
    "Tap or paste this link to open your clubs (it works once and expires in " + expiresLabel + "):",
    signInUrl,
    "",
    "If you did not ask for this email, you can ignore it.",
    "",
    "— Book Club",
  ].join("\n");
}

/**
 * HTML magic-link email. Inline styles only; palette matches :root in globals.css (cozy shelf).
 */
export function signInEmailHtml({ signInUrl, host, expiresLabel }: SignInEmailContent) {
  const safeUrl = escapeHtml(signInUrl);
  const safeHost = escapeHtml(host);
  const safeExpires = escapeHtml(expiresLabel);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>Sign in to Book Club</title>
    <!--[if mso]>
    <noscript>
      <xml>
        <o:OfficeDocumentSettings>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    </noscript>
    <![endif]-->
  </head>
  <body style="margin:0;padding:0;background-color:#f5ebe3;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;color:#fdf8f5;">
      One tap to rejoin your book clubs — link expires in ${safeExpires}.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5ebe3;background-image:linear-gradient(165deg, rgba(184,169,196,0.22) 0%, #fdf8f5 38%, rgba(201,137,122,0.12) 70%, #fdf8f5 100%);">
      <tr>
        <td align="center" style="padding:40px 16px 48px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;">
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#7d9b7a;">
                  &#128214;&nbsp; Book Club
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#fffaf6;border:1px solid #e8d9cc;border-radius:20px;padding:32px 28px;box-shadow:0 12px 40px rgba(61,52,44,0.08);">
                <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:600;line-height:1.25;letter-spacing:-0.02em;color:#3d342c;">
                  Welcome back
                </h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.55;color:#8a7b6c;">
                  Tap the button below to sign in to <strong style="color:#4a3f36;font-weight:600;">${safeHost}</strong> and catch up on polls, meetings, and your shelf.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
                  <tr>
                    <td align="center" style="border-radius:12px;background-color:#7d9b7a;">
                      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;text-decoration:none;color:#fdf8f5;border-radius:12px;background-color:#7d9b7a;border:1px solid #6d8a6a;">
                        Sign in to Book Club
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:#8a7b6c;">
                  Or copy this link into your browser:
                </p>
                <p style="margin:0 0 24px;font-size:12px;line-height:1.45;word-break:break-all;">
                  <a href="${safeUrl}" style="color:#7d9b7a;text-decoration:underline;">${safeUrl}</a>
                </p>
                <hr style="border:none;border-top:1px solid #e8d9cc;margin:0 0 20px;" />
                <p style="margin:0;font-size:13px;line-height:1.55;color:#8a7b6c;">
                  This link expires in <strong style="color:#4a3f36;font-weight:600;">${safeExpires}</strong> and works once. If you did not request it, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:24px;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#a8998a;">
                  Made for reading groups who like a soft place to land.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
