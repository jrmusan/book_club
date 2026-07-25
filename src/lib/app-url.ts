/**
 * Public site origin for invite links, auth callbacks, etc.
 * Server-only — do not import from client components.
 */
export function appBaseUrl() {
  const base =
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.RENDER_EXTERNAL_URL ??
    "http://localhost:3000";
  return base.replace(/\/$/, "");
}

export function inviteAcceptUrl(token: string) {
  return `${appBaseUrl()}/invite/${token}`;
}
