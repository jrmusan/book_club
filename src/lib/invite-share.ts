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
    `If you don't have an account yet, register with this email address first, then open the link.`,
  ].join("\n");

  return `mailto:${encodeURIComponent(opts.to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
