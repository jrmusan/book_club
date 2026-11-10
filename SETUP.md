# Resend email sign-in

Sign-in sends a one-time link with the Resend API (`POST https://api.resend.com/emails`). The link returns to this app, Auth.js checks the token, and the existing JWT session cookie is set. Users are matched by email. There is no password and no username.

Do these in order. Placeholder names for the variables are in `.env.example`.

## 1. Create a Resend account

Sign up at [resend.com](https://resend.com).

## 2. Verify the sending domain

In Resend, open **Domains** and add the domain in `RESEND_FROM_EMAIL` (the part after `@`). Pick the region closest to your readers.

Open that domain’s **Records** tab and add every record it shows, copied exactly, at your DNS host. Resend generates the values. Two shapes exist. Use the one on the screen, not a mix.

Older domains:

- **DKIM** — `TXT` at `resend._domainkey`
- **SPF** — `TXT` at the return-path host (default `send`) with a value like `v=spf1 include:amazonses.com ~all`
- **Return path** — `MX` at that same host (default `send`), pointing at Resend’s feedback SMTP host, priority 10

Domains added after August 2026:

- **DKIM** — `TXT` at `resend._domainkey`
- **Sending and return path** — `CNAME` records, usually on `send` and an `r`-prefixed sibling such as `rsend`

If the Records tab shows a `CNAME` for DKIM or the return path, add that type instead of the older `TXT` or `MX`. A `CNAME` cannot share a name with any other record, and it must be DNS-only (on Cloudflare, grey cloud, not proxied).

Wait until the domain shows **Verified**. That is often about 15 minutes and can take up to 72 hours. Use **Restart verification** if it stalls. These records do not replace the apex record that points the website at Vercel or Render. They live on `resend._domainkey` and `send` (or your custom return-path subdomain).

## 3. Create an API key

In Resend, open **API Keys**, create a key with **Sending access**, and copy it. It starts with `re_`.

## 4. Store the key and the from address

Set these in the host’s environment, not in git:

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | The key from step 3 |
| `RESEND_FROM_EMAIL` | An address on the verified domain, for example `Book Club <login@yourdomain.com>` |

Locally, copy `.env.example` to `.env` and fill the same two values.

Until the domain is verified, Resend can send only from `onboarding@resend.dev`, and only to the inbox that owns the Resend account. That is a local smoke test, not a production sender.

## 5. Callback URL

Resend does not host a magic-link redirect allowlist. The OAuth redirect URI list in the Resend dashboard is for apps that call the Resend API on behalf of other accounts. This app does not use it. Leave that list empty.

The link in the email is built from `AUTH_URL` and lands on:

`{AUTH_URL}/api/auth/callback/resend`

Set `AUTH_URL` (and `NEXTAUTH_URL`, the same value) to the origin people use:

- Local: `http://localhost:3000`
- Vercel: the production URL, or the custom domain if you attached one. No trailing slash.
- Render: `render.yaml` sets `AUTH_URL` from `RENDER_EXTERNAL_URL`. If you add a custom domain, set `AUTH_URL` to that origin by hand.

Auth.js accepts the callback only on that origin. After the token checks out, the app redirects to a same-origin path (the page they came from, or `/dashboard`).

## 6. Session cookie

| Variable | Purpose |
| --- | --- |
| `AUTH_SECRET` | Signs the session cookie. `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` on Vercel and Render, where the platform terminates TLS |
| `AUTH_SESSION_MAX_AGE` | Cookie lifetime in seconds. `2592000` is 30 days |

The cookie is httpOnly, `SameSite=Lax`, and `Path=/`. It is `Secure` and named `__Secure-authjs.session-token` when `AUTH_URL` is `https`. Local `http` uses `authjs.session-token`.

## 7. This app’s hosts

The next deploy runs `prisma migrate deploy`. That migration drops `username` and `passwordHash`. User ids, emails, and names stay, so club membership still matches the same person when they sign in with that email. Passwords stop working. Usernames are not kept.

**Vercel** — Settings → Environment Variables. Set `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `AUTH_SECRET`, `AUTH_TRUST_HOST`, `AUTH_URL`, `NEXTAUTH_URL`, `AUTH_SESSION_MAX_AGE`, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL`. If the site uses a custom domain, add that domain in Vercel and set `AUTH_URL` to it. Resend DNS stays on the sending domain from step 2.

**Render** — `render.yaml` already wires `AUTH_SECRET`, `AUTH_TRUST_HOST`, `AUTH_URL`, `NEXTAUTH_URL`, and `AUTH_SESSION_MAX_AGE`. In the Render dashboard, set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (they are `sync: false` so the file does not contain secrets).

**Database** — Neon `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) stay as they are. No new database vendor.

## 8. Confirm

1. Deploy, or locally run `npx prisma migrate deploy` after the env file is filled.
2. Open `/login`, enter an email on a domain Resend can deliver to, and send the link.
3. Open the link. You should land on `/dashboard` with a session cookie. A new email creates a user. An existing email keeps the same user id.
