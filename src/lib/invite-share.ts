/** Client-safe invite share helpers (no server env access). */

export function inviteMailtoHref(opts: {
  to: string;
  clubName: string;
  inviteUrl: string;
  invitedBy?: string;
}) {
  const who = opts.invitedBy?.trim() || "Someone";
  const subject = `You're invited to join ${opts.clubName}`;
  const body = [
    `Hi,`,
    ``,
    `${who} invited you to the book club "${opts.clubName}".`,
    ``,
    `Accept here: ${opts.inviteUrl}`,
    ``,
    `Open the link and sign in with this email address. If you're new, that creates your account.`,
  ].join("\n");

  return `mailto:${encodeURIComponent(opts.to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
