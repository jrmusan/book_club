/**
 * Only allow same-origin relative paths as post-auth redirects.
 */
export function safeCallbackUrl(value: string | null | undefined, fallback = "/dashboard") {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
